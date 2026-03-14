import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXProps {
  children: string;
  inline?: boolean;
  className?: string;
}

// Component to render LaTeX mathematical expressions
export function LaTeX({ children, inline = false, className = "" }: LaTeXProps) {
  try {
    if (inline) {
      return (
        <span className={className}>
          <InlineMath>{children}</InlineMath>
        </span>
      );
    } else {
      return (
        <div className={className}>
          <BlockMath>{children}</BlockMath>
        </div>
      );
    }
  } catch (error) {
    console.warn('LaTeX rendering error:', error);
    // Fallback to showing the raw LaTeX if rendering fails
    return (
      <code className={`bg-red-50 text-red-700 px-2 py-1 rounded text-sm font-mono ${className}`}>
        {inline ? `$${children}$` : `$$${children}$$`}
      </code>
    );
  }
}

// Component to parse text and render inline LaTeX formulas
export function MathText({ children, className = "" }: { children: string; className?: string }) {
  if (!children) return null;

  // Split text by LaTeX delimiters
  const parts = children.split(/(\$\$[^$]*\$\$|\$[^$]*\$)/);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block math
          const math = part.slice(2, -2);
          return <LaTeX key={index} inline={false}>{math}</LaTeX>;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math
          const math = part.slice(1, -1);
          return <LaTeX key={index} inline={true}>{math}</LaTeX>;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
}