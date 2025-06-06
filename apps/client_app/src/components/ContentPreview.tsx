import React, { useState, useEffect } from 'react';

interface ContentPreviewProps {
  content: string;
}

export default function ContentPreview({ content: initialContent }: ContentPreviewProps) {
  const [content, setContent] = useState(initialContent);

  // Listen for content updates
  useEffect(() => {
    const handleContentLoaded = (event: CustomEvent<{ content: string }>) => {
      setContent(event.detail.content);
    };

    const handleContentUpdated = (event: CustomEvent<{ content: string }>) => {
      setContent(event.detail.content);
    };

    document.addEventListener('content-loaded', handleContentLoaded as EventListener);
    document.addEventListener('content-updated', handleContentUpdated as EventListener);

    return () => {
      document.removeEventListener('content-loaded', handleContentLoaded as EventListener);
      document.removeEventListener('content-updated', handleContentUpdated as EventListener);
    };
  }, []);

  return (
    <div className="content-preview">
      <h2>Content Preview</h2>
      <div className="preview-container">
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      </div>
      
      <style>{`
        .content-preview {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .preview-container {
          border: 1px solid #e1e1e1;
          border-radius: 4px;
          padding: 20px;
          background-color: #f8f9fa;
        }
        
        .markdown-content {
          line-height: 1.6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        .markdown-content h1, 
        .markdown-content h2, 
        .markdown-content h3, 
        .markdown-content h4, 
        .markdown-content h5, 
        .markdown-content h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .markdown-content h1 {
          font-size: 2em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }
        
        .markdown-content h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }
        
        .markdown-content ul, 
        .markdown-content ol {
          padding-left: 2em;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .markdown-content li {
          margin-top: 0.25em;
        }
        
        .markdown-content code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: rgba(27, 31, 35, 0.05);
          border-radius: 3px;
          font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        .markdown-content pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #f6f8fa;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

// Simple markdown renderer - in a real app you'd use a proper markdown library
function renderMarkdown(markdown: string): string {
  // This is very simplistic, for a real app you'd use a proper markdown library
  let html = markdown;
  
  // Replace markdown headers
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  
  // Replace markdown lists
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n)+/g, (match) => `<ul>${match}</ul>`);
  
  // Replace line breaks with paragraphs
  html = html.replace(/^([^<].*?)$/gm, (match) => {
    if (match.trim().length > 0 && !match.startsWith('<')) {
      return `<p>${match}</p>`;
    }
    return match;
  });
  
  // Remove frontmatter (simplistic approach)
  html = html.replace(/---\n([\s\S]*?)\n---/, '');
  
  return html;
} 