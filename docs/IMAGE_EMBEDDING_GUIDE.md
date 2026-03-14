# 📸 Image Embedding Guide for Questions

This guide explains how to embed images in questions, options, and explanations on the NEET & JEE Mock Test Platform.

## Overview

The platform supports rich content in questions through the **ContentBlock** system, which allows you to include:
- ✅ Plain text
- ✅ Images
- ✅ LaTeX formulas (coming soon)
- ✅ MathML (coming soon)

## ContentBlock Structure

```typescript
type ContentBlock = {
  type: 'plain' | 'latex' | 'mathml' | 'image';
  value: string;
}
```

## Where You Can Add Images

1. **Question Text** - Use `questionContent` field
2. **Answer Options** - Use `optionContents` field
3. **Explanations** - Use `explanationContent` field (visible in results)

---

## Step-by-Step Guide

### Step 1: Upload Images to Object Storage

1. Open the **"Object Storage"** tool pane in Replit (sidebar)
2. Navigate to the `public` directory
3. Upload your image files:
   - Supported formats: PNG, JPG, JPEG, GIF, SVG
   - Recommended: Use descriptive names like `physics-diagram-1.png`, `chemistry-reaction-2.jpg`

4. **Copy the public URL** of your uploaded image. It will look like:
   ```
   https://storage.googleapis.com/[bucket-id]/public/physics-diagram-1.png
   ```

### Step 2: Format Your Question Data

#### Example 1: Question with Single Image

```json
{
  "text": "Refer to the circuit diagram below. What is the equivalent resistance?",
  "questionContent": [
    {
      "type": "plain",
      "value": "Refer to the circuit diagram below:"
    },
    {
      "type": "image",
      "value": "https://storage.googleapis.com/[bucket]/public/circuit-diagram.png"
    },
    {
      "type": "plain",
      "value": "What is the equivalent resistance between points A and B?"
    }
  ],
  "options": ["5Ω", "10Ω", "15Ω", "20Ω"],
  "correctOption": 1,
  "explanation": "Using series and parallel resistance formulas..."
}
```

#### Example 2: Options with Images

```json
{
  "text": "Which graph correctly represents the motion described?",
  "questionContent": [
    {
      "type": "plain",
      "value": "A particle moves with constant acceleration. Which graph correctly represents the motion?"
    }
  ],
  "options": ["Graph A", "Graph B", "Graph C", "Graph D"],
  "optionContents": [
    [
      { "type": "plain", "value": "Graph A:" },
      { "type": "image", "value": "https://storage.googleapis.com/[bucket]/public/graph-a.png" }
    ],
    [
      { "type": "plain", "value": "Graph B:" },
      { "type": "image", "value": "https://storage.googleapis.com/[bucket]/public/graph-b.png" }
    ],
    [
      { "type": "plain", "value": "Graph C:" },
      { "type": "image", "value": "https://storage.googleapis.com/[bucket]/public/graph-c.png" }
    ],
    [
      { "type": "plain", "value": "Graph D:" },
      { "type": "image", "value": "https://storage.googleapis.com/[bucket]/public/graph-d.png" }
    ]
  ],
  "correctOption": 2
}
```

#### Example 3: Question with Multiple Images

```json
{
  "text": "Compare the two microscope images.",
  "questionContent": [
    {
      "type": "plain",
      "value": "Sample 1:"
    },
    {
      "type": "image",
      "value": "https://storage.googleapis.com/[bucket]/public/sample-1.jpg"
    },
    {
      "type": "plain",
      "value": "Sample 2:"
    },
    {
      "type": "image",
      "value": "https://storage.googleapis.com/[bucket]/public/sample-2.jpg"
    },
    {
      "type": "plain",
      "value": "Which statement is correct?"
    }
  ],
  "options": [
    "Sample 1 shows more cell division",
    "Sample 2 shows more cell division",
    "Both show equal division",
    "Neither shows division"
  ],
  "correctOption": 0
}
```

### Step 3: Upload Questions via Admin Panel

1. Go to **Admin > Questions > Upload Questions**
2. Prepare your CSV/JSON file with the ContentBlock format
3. Upload the file
4. Questions with images will render automatically in tests!

---

## CSV Upload Format

If using CSV format for bulk upload, use JSON strings for the content fields:

```csv
text,questionContent,options,optionContents,correctOption,subjectId,difficultyLevel
"Circuit question","[{\"type\":\"plain\",\"value\":\"Refer to the diagram:\"},{\"type\":\"image\",\"value\":\"https://storage.googleapis.com/bucket/public/circuit.png\"}]","5Ω|10Ω|15Ω|20Ω","",1,"physics-uuid",3
```

---

## Best Practices

### Image Guidelines

1. **Image Size**
   - Keep images under 500KB for fast loading
   - Recommended dimensions: 800x600px max
   - Use appropriate compression

2. **Image Quality**
   - Clear, high-contrast diagrams
   - Readable text/labels in images
   - Use PNG for diagrams, JPG for photos

3. **Accessibility**
   - Always include descriptive text before/after images
   - Don't rely solely on images for critical information
   - Provide text alternatives in options

### Organization

1. **Naming Convention**
   ```
   public/
     physics/
       mechanics-diagram-1.png
       optics-setup-2.jpg
     chemistry/
       reaction-mechanism-1.png
     biology/
       cell-structure-1.jpg
   ```

2. **Version Control**
   - Use version numbers: `diagram-v1.png`, `diagram-v2.png`
   - Keep backup of original high-res images

### Content Blocks Order

Always structure content logically:
```javascript
[
  { type: 'plain', value: 'Introduction text' },
  { type: 'image', value: 'url-to-image' },
  { type: 'plain', value: 'Question text' }
]
```

---

## Fallback Handling

- If `questionContent` is empty/null, the system uses the plain `text` field
- If `optionContents` is empty/null, the system uses the `options` array
- Images that fail to load show an error message

---

## Testing Your Images

1. Upload a test question with images
2. Create a test paper including that question
3. Start a practice test
4. Verify images render correctly
5. Check on different screen sizes

---

## Troubleshooting

### Images Not Showing?

1. **Check the URL**
   - Ensure the URL is publicly accessible
   - Test the URL in a browser

2. **Check ContentBlock Format**
   ```json
   {
     "type": "image",
     "value": "https://full-url-here.png"
   }
   ```

3. **Check JSON Syntax**
   - Ensure proper escaping in JSON strings
   - Validate JSON structure

### Performance Issues?

1. Compress images before upload
2. Use appropriate image formats (PNG for diagrams, JPG for photos)
3. Limit image dimensions to 800x600px

---

## API Reference

### Question Schema with Images

```typescript
{
  // Legacy fields (still supported)
  text: string;
  options: string[];
  
  // Rich content fields (preferred)
  questionContent?: ContentBlock[];
  optionContents?: ContentBlock[][];
  explanationContent?: ContentBlock[];
  
  // Other fields
  correctOption: number;
  difficultyLevel: number;
  // ... other fields
}
```

### ContentBlock Type Definition

```typescript
type ContentBlock = {
  type: 'plain' | 'latex' | 'mathml' | 'image';
  value: string;  // For images, this is the URL
}
```

---

## Future Enhancements

Coming soon:
- ✨ LaTeX formula rendering
- ✨ MathML support for complex equations
- ✨ Image upload directly from admin panel
- ✨ Drag-and-drop image insertion
- ✨ Image cropping/editing tools

---

## Support

For questions or issues:
1. Check this guide first
2. Test with a simple example
3. Contact the development team

Happy question creation! 🎓
