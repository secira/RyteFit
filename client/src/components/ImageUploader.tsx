import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  children?: React.ReactNode;
  maxFileSize?: number; // in MB
  accept?: string;
  className?: string;
}

export function ImageUploader({
  onImageUploaded,
  children,
  maxFileSize = 5,
  accept = "image/*",
  className = ""
}: ImageUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetState = () => {
    setProgress(0);
    setError(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Get upload URL from backend
      const response = await apiRequest('/api/objects/upload', {
        method: 'POST'
      });

      const data = await response.json();
      const { uploadURL } = data;
      
      if (!uploadURL) {
        throw new Error('No upload URL received from server');
      }
      
      // Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to storage');
      }

      // Extract the object path from the signed URL
      // Remove query parameters first
      const baseUrl = uploadURL.split('?')[0];
      
      // Extract the path after the bucket/storage base URL
      let objectPath = '';
      
      if (baseUrl.includes('/uploads/')) {
        // Extract everything after the storage base URL
        const parts = baseUrl.split('/uploads/');
        objectPath = `/objects/uploads/${parts[1]}`;
      } else {
        // Fallback: use the last part of the URL
        const urlParts = baseUrl.split('/');
        const objectId = urlParts[urlParts.length - 1];
        objectPath = `/objects/uploads/${objectId}`;
      }

      setProgress(100);
      onImageUploaded(objectPath);
      setIsOpen(false);
      resetState();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className={className} data-testid="button-upload-image">
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-image-upload">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Upload Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Input */}
          <div className="flex flex-col items-center gap-4">
            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center w-full">
                <input
                  type="file"
                  accept={accept}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-file-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to select an image file
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: {maxFileSize}MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative w-full">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  data-testid="img-preview"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  data-testid="button-remove-image"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" data-testid="progress-upload" />
              <p className="text-sm text-center text-gray-600">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center" data-testid="text-error">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              data-testid="button-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}