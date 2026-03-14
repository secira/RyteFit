import { Card } from "@/components/ui/card";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

type ContentBlock = {
  type: 'plain' | 'latex' | 'mathml' | 'image';
  value: string;
};

interface RichContentProps {
  content: ContentBlock[] | null | undefined;
  fallbackText?: string;
  className?: string;
}

export function RichContent({ content, fallbackText = "", className = "" }: RichContentProps) {
  // If no content blocks, fallback to plain text
  if (!content || content.length === 0) {
    return <div className={className}>{fallbackText}</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {content.map((block, index) => {
        switch (block.type) {
          case 'plain':
            return (
              <p key={index} className="leading-relaxed">
                {block.value}
              </p>
            );

          case 'image':
            return (
              <div key={index} className="my-4 flex justify-center">
                <img
                  src={block.value}
                  alt={`Question image ${index + 1}`}
                  className="max-w-full h-auto rounded-md border border-border"
                  style={{ maxHeight: '400px' }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-sm text-muted-foreground p-4 border border-dashed rounded-md';
                    errorDiv.textContent = 'Image failed to load';
                    img.parentNode?.insertBefore(errorDiv, img);
                  }}
                />
              </div>
            );

          case 'latex':
            // Properly render LaTeX using react-katex
            let mathContent = block.value.trim();
            let isDisplay = false;
            
            // Remove delimiters and determine display vs inline
            if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
              mathContent = mathContent.slice(2, -2);
              isDisplay = true;
            } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
              mathContent = mathContent.slice(2, -2);
              isDisplay = true;
            } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
              mathContent = mathContent.slice(1, -1);
            } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
              mathContent = mathContent.slice(2, -2);
            }
            
            try {
              if (isDisplay) {
                return (
                  <div key={index} className="my-4">
                    <BlockMath math={mathContent} />
                  </div>
                );
              } else {
                return (
                  <span key={index} className="inline-block mx-1">
                    <InlineMath math={mathContent} />
                  </span>
                );
              }
            } catch (err) {
              console.warn('KaTeX render error:', err);
              return (
                <span key={index} className="text-red-500 text-sm">
                  Formula error: {block.value}
                </span>
              );
            }

          case 'mathml':
            return (
              <div key={index} className="my-2">
                <div dangerouslySetInnerHTML={{ __html: block.value }} />
              </div>
            );

          default:
            return (
              <p key={index} className="leading-relaxed">
                {block.value}
              </p>
            );
        }
      })}
    </div>
  );
}

interface RichOptionProps {
  content: ContentBlock[] | null | undefined;
  fallbackText: string;
  optionLetter: string;
}

export function RichOption({ content, fallbackText, optionLetter }: RichOptionProps) {
  // If no content blocks, fallback to plain text
  if (!content || content.length === 0) {
    return (
      <span>
        {optionLetter}. {fallbackText}
      </span>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <span className="font-medium">{optionLetter}.</span>
      <div className="flex-1 space-y-2">
        {content.map((block, index) => {
          switch (block.type) {
            case 'plain':
              return (
                <span key={index} className="inline">
                  {block.value}
                </span>
              );

            case 'image':
              return (
                <div key={index} className="my-2">
                  <img
                    src={block.value}
                    alt={`Option ${optionLetter} image`}
                    className="max-w-full h-auto rounded-md border border-border"
                    style={{ maxHeight: '200px' }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                </div>
              );

            case 'latex':
              // Properly render LaTeX using react-katex
              let mathContent = block.value.trim();
              let isDisplay = false;
              
              // Remove delimiters and determine display vs inline
              if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
                mathContent = mathContent.slice(2, -2);
                isDisplay = true;
              } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
                mathContent = mathContent.slice(2, -2);
                isDisplay = true;
              } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
                mathContent = mathContent.slice(1, -1);
              } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
                mathContent = mathContent.slice(2, -2);
              }
              
              try {
                if (isDisplay) {
                  return (
                    <div key={index} className="my-2">
                      <BlockMath math={mathContent} />
                    </div>
                  );
                } else {
                  return (
                    <span key={index} className="inline-block mx-1">
                      <InlineMath math={mathContent} />
                    </span>
                  );
                }
              } catch (err) {
                console.warn('KaTeX render error:', err);
                return (
                  <span key={index} className="text-red-500 text-sm">
                    Formula error: {block.value}
                  </span>
                );
              }

            case 'mathml':
              return (
                <div key={index} dangerouslySetInnerHTML={{ __html: block.value }} />
              );

            default:
              return (
                <span key={index} className="inline">
                  {block.value}
                </span>
              );
          }
        })}
      </div>
    </div>
  );
}
