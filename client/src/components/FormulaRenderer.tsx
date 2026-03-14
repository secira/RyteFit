import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { ContentBlock } from '@shared/schema';

interface FormulaRendererProps {
  content: ContentBlock[];
  className?: string;
}

// Component to render a single content block
function ContentBlockRenderer({ block, className = "" }: { block: ContentBlock; className?: string }) {
  switch (block.type) {
    case 'plain':
      return <span className={className}>{block.value}</span>;
      
    case 'latex':
      // Check if it's display math or inline math
      let mathContent = block.value;
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
            <div className={className}>
              <BlockMath math={mathContent} />
            </div>
          );
        } else {
          return (
            <span className={className}>
              <InlineMath math={mathContent} />
            </span>
          );
        }
      } catch (err) {
        console.warn('KaTeX render error:', err);
        return <span className={`text-red-500 ${className}`}>Formula error: {block.value}</span>;
      }
      
    case 'mathml':
      return (
        <span className={`formula-mathml ${className}`} dangerouslySetInnerHTML={{ __html: block.value }} />
      );
      
    case 'image':
      return (
        <img 
          src={block.value} 
          alt="Formula" 
          className={`formula-image max-w-full h-auto ${className}`}
          onError={(e) => {
            console.warn('Formula image failed to load:', block.value);
            // Show fallback text
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
      
    default:
      return <span className={`text-red-500 ${className}`}>Unknown content type: {(block as any).type}</span>;
  }
}

// Main FormulaRenderer component that renders an array of content blocks
export function FormulaRenderer({ content, className = "" }: FormulaRendererProps) {
  if (!content || content.length === 0) {
    return null;
  }

  return (
    <div className={`formula-renderer ${className}`}>
      {content.map((block, index) => (
        <ContentBlockRenderer key={index} block={block} className="inline" />
      ))}
    </div>
  );
}

// Utility function to convert plain text to content blocks with LaTeX and Image parsing
export function textToContentBlocks(text: string): ContentBlock[] {
  if (!text) return [];
  
  const blocks: ContentBlock[] = [];
  let currentPos = 0;
  
  // Regular expressions to match LaTeX delimiters and image markers
  const patterns = [
    { regex: /\$\$([\s\S]*?)\$\$/g, type: 'latex' as const, display: true },   // Display math $$...$$
    { regex: /\\\[([\s\S]*?)\\\]/g, type: 'latex' as const, display: true },    // Display math \[...\]
    { regex: /\$([^\$\n]+?)\$/g, type: 'latex' as const, display: false },      // Inline math $...$
    { regex: /\\\(([^\)]+?)\\\)/g, type: 'latex' as const, display: false },    // Inline math \(...\)
    { regex: /IMAGE:(\S+)/g, type: 'image' as const, display: false },          // Image marker IMAGE:/path/to/image.jpg
    { regex: /!\[([^\]]*)\]\((\S+)\)/g, type: 'image' as const, display: false }, // Markdown image ![alt](/path)
  ];
  
  // Find all matches (LaTeX and Images)
  const allMatches: { index: number; length: number; value: string; type: 'latex' | 'image'; display: boolean }[] = [];
  
  patterns.forEach(({ regex, type, display }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      let value = match[0];
      
      // For IMAGE: syntax, extract just the URL part
      if (type === 'image' && match[0].startsWith('IMAGE:')) {
        value = match[1]; // Just the URL after IMAGE:
      }
      // For markdown ![alt](url), extract the URL
      else if (type === 'image' && match[0].startsWith('![')) {
        value = match[2]; // The URL from ![alt](url)
      }
      
      allMatches.push({
        index: match.index,
        length: match[0].length,
        value: value,
        type,
        display
      });
    }
  });
  
  // Sort matches by position
  allMatches.sort((a, b) => a.index - b.index);
  
  // Build content blocks
  allMatches.forEach((match) => {
    // Add plain text before this match
    if (currentPos < match.index) {
      const plainText = text.substring(currentPos, match.index);
      if (plainText) {
        blocks.push({ type: 'plain', value: plainText });
      }
    }
    
    // Add LaTeX or Image block
    if (match.type === 'image') {
      blocks.push({ type: 'image', value: match.value });
    } else {
      blocks.push({ type: 'latex', value: match.value });
    }
    currentPos = match.index + match.length;
  });
  
  // Add remaining plain text
  if (currentPos < text.length) {
    const plainText = text.substring(currentPos);
    if (plainText) {
      blocks.push({ type: 'plain', value: plainText });
    }
  }
  
  // If nothing was found, return plain text
  if (blocks.length === 0) {
    return [{ type: 'plain', value: text }];
  }
  
  return blocks;
}

// Utility function to check if content has formulas
export function hasFormulas(content: ContentBlock[]): boolean {
  if (!content) return false;
  return content.some(block => block.type === 'latex' || block.type === 'mathml' || block.type === 'image');
}