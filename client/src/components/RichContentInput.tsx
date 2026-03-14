import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Upload } from "lucide-react";
import { FormulaRenderer, textToContentBlocks } from "./FormulaRenderer";
import { ImageUploader } from "./ImageUploader";
import type { ContentBlock } from '@shared/schema';

interface RichContentInputProps {
  label: string;
  value: string;
  format: 'plain' | 'latex' | 'mathml' | 'image';
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  onValueChange: (value: string) => void;
  onFormatChange: (format: 'plain' | 'latex' | 'mathml' | 'image') => void;
  showPreview?: boolean;
  onTogglePreview?: (show: boolean) => void;
  testId?: string;
}

export function RichContentInput({
  label,
  value,
  format,
  placeholder = "",
  required = false,
  multiline = false,
  onValueChange,
  onFormatChange,
  showPreview = false,
  onTogglePreview,
  testId
}: RichContentInputProps) {
  // Create preview content - parse LaTeX even from plain text
  const previewContent: ContentBlock[] = value.trim() 
    ? (format === 'plain' ? textToContentBlocks(value) : [{ type: format, value }])
    : [];
  

  const formatLabels = {
    plain: 'Plain Text',
    latex: 'LaTeX',
    mathml: 'MathML',
    image: 'Image URL'
  };

  const formatPlaceholders = {
    plain: placeholder || "Enter text...",
    latex: "Enter LaTeX formula (e.g., x^2 + y^2 = z^2 or $\\frac{a}{b}$)",
    mathml: "Enter MathML markup (e.g., <math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>)",
    image: "Enter image URL or upload an image file"
  };

  const renderInput = () => {
    if (format === 'image') {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={formatPlaceholders[format]}
              data-testid={testId}
              className="flex-1"
            />
            <ImageUploader
              onImageUploaded={onValueChange}
              className="flex-shrink-0"
            >
              <Button type="button" variant="outline" size="sm" data-testid={`${testId}-upload`}>
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
            </ImageUploader>
          </div>
          <div className="text-xs text-muted-foreground">
            You can either enter an image URL or upload an image file directly
          </div>
        </div>
      );
    }

    if (multiline || format === 'mathml') {
      return (
        <Textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={formatPlaceholders[format]}
          className={multiline ? "min-h-[100px]" : "min-h-[80px]"}
          data-testid={testId}
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={formatPlaceholders[format]}
        data-testid={testId}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {onTogglePreview && value.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onTogglePreview(!showPreview)}
            className="h-6 px-2 text-xs"
          >
            {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={format} onValueChange={onFormatChange}>
            <SelectTrigger className="w-[140px]" data-testid={`${testId}-format`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plain">{formatLabels.plain}</SelectItem>
              <SelectItem value="latex">{formatLabels.latex}</SelectItem>
              <SelectItem value="mathml">{formatLabels.mathml}</SelectItem>
              <SelectItem value="image">{formatLabels.image}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderInput()}

      {showPreview && previewContent.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Preview:</div>
          <FormulaRenderer content={previewContent} className="preview-content" />
        </div>
      )}

      {format === 'latex' && (
        <div className="text-xs text-muted-foreground">
          {"LaTeX Tips: Use $formula$ for inline math, $$formula$$ for display math. Examples: $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\sum_{i=1}^n$"}
        </div>
      )}

      {format === 'mathml' && (
        <div className="text-xs text-muted-foreground">
          <strong>MathML Tips:</strong> Use proper MathML tags. 
          Example: {"<math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>"}
        </div>
      )}
    </div>
  );
}