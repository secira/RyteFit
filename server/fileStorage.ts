import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";

const APP_ENV = process.env.APP_ENV || "TEST";
const IS_PROD = APP_ENV === "PROD";

let s3Client: S3Client | null = null;
const S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

export interface UploadResult {
  path: string;
  isS3: boolean;
}

export interface VideoMeta {
  exists: boolean;
  size?: number;
  isS3: boolean;
  s3Key?: string;
  localPath?: string;
}

/**
 * Upload a video buffer. Returns the stored path/key to persist in the DB.
 * Format: "s3:<key>" for S3, "uploads/videos/<filename>" for local.
 */
export async function uploadVideo(
  buffer: Buffer,
  fileName: string
): Promise<UploadResult> {
  if (IS_PROD) {
    if (!S3_BUCKET) {
      throw new Error("AWS_S3_BUCKET env variable is required in PROD mode");
    }

    const s3Key = `interview-videos/${fileName}`;
    const client = getS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: "video/webm",
      })
    );

    console.log(`[FileStorage] Video uploaded to S3: s3://${S3_BUCKET}/${s3Key}`);
    return { path: `s3:${s3Key}`, isS3: true };
  } else {
    const videoDir = path.resolve(process.cwd(), "uploads", "videos");
    await fs.promises.mkdir(videoDir, { recursive: true });

    const absolutePath = path.join(videoDir, fileName);
    await fs.promises.writeFile(absolutePath, buffer);

    const relativePath = `uploads/videos/${fileName}`;
    console.log(`[FileStorage] Video saved locally: ${absolutePath}`);
    return { path: relativePath, isS3: false };
  }
}

/**
 * Get metadata about a stored video (exists, size).
 */
export async function getVideoMeta(storedPath: string): Promise<VideoMeta> {
  if (storedPath.startsWith("s3:")) {
    const s3Key = storedPath.slice(3);
    try {
      const client = getS3Client();
      const result = await client.send(
        new HeadObjectCommand({ Bucket: S3_BUCKET, Key: s3Key })
      );
      return {
        exists: true,
        size: result.ContentLength,
        isS3: true,
        s3Key,
      };
    } catch {
      return { exists: false, isS3: true, s3Key };
    }
  } else {
    const absolutePath = path.resolve(process.cwd(), storedPath);
    const exists = fs.existsSync(absolutePath);
    if (exists) {
      const stat = fs.statSync(absolutePath);
      return { exists: true, size: stat.size, isS3: false, localPath: absolutePath };
    }
    return { exists: false, isS3: false, localPath: absolutePath };
  }
}

/**
 * Get a pre-signed URL for S3 video (1-hour expiry) or a local streaming URL.
 */
export async function getVideoStreamUrl(
  storedPath: string,
  applicationId: string
): Promise<string | null> {
  if (storedPath.startsWith("s3:")) {
    const s3Key = storedPath.slice(3);
    try {
      const client = getS3Client();
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
        { expiresIn: 3600 }
      );
      return url;
    } catch {
      return null;
    }
  } else {
    return `/api/applications/${applicationId}/interview-video/stream`;
  }
}

/**
 * Stream a local video file to an HTTP response with range support.
 * Only used in TEST mode (local storage). In PROD, clients use pre-signed S3 URLs.
 */
export function streamLocalVideo(
  storedPath: string,
  rangeHeader: string | undefined,
  res: any
): void {
  const absolutePath = path.resolve(process.cwd(), storedPath);

  if (!fs.existsSync(absolutePath)) {
    res.status(404).json({ message: "Video file not found" });
    return;
  }

  const stat = fs.statSync(absolutePath);
  const fileSize = stat.size;

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(absolutePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/webm",
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/webm",
    });
    fs.createReadStream(absolutePath).pipe(res);
  }
}

/**
 * Stream an S3 object to an HTTP response with range support.
 * Used in PROD mode for direct server-side streaming (alternative to pre-signed URLs).
 */
export async function streamS3Video(
  storedPath: string,
  rangeHeader: string | undefined,
  res: any
): Promise<void> {
  const s3Key = storedPath.slice(3);
  const client = getS3Client();

  try {
    const meta = await client.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: s3Key })
    );
    const fileSize = meta.ContentLength || 0;

    const commandParams: any = { Bucket: S3_BUCKET, Key: s3Key };

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      commandParams.Range = `bytes=${start}-${end}`;

      const result = await client.send(new GetObjectCommand(commandParams));
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/webm",
      });
      (result.Body as Readable).pipe(res);
    } else {
      const result = await client.send(new GetObjectCommand(commandParams));
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/webm",
      });
      (result.Body as Readable).pipe(res);
    }
  } catch (err) {
    console.error("[FileStorage] S3 stream error:", err);
    res.status(500).json({ message: "Failed to stream video from S3" });
  }
}

/**
 * Delete a stored video (local or S3).
 */
export async function deleteVideo(storedPath: string): Promise<void> {
  if (storedPath.startsWith("s3:")) {
    const s3Key = storedPath.slice(3);
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }));
    console.log(`[FileStorage] Deleted S3 object: ${s3Key}`);
  } else {
    const absolutePath = path.resolve(process.cwd(), storedPath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      console.log(`[FileStorage] Deleted local file: ${absolutePath}`);
    }
  }
}

export { IS_PROD, APP_ENV };
