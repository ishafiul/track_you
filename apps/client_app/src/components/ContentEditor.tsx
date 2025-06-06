import React, { useState, useEffect } from 'react';
import {updateContent} from "../lib/api.ts";

interface ContentEditorProps {
  initialContent: string;
  filePath: string;
}

export default function ContentEditor({ initialContent, filePath }: ContentEditorProps) {
  const [content, setContent] = useState(initialContent || '');
  const [path, setPath] = useState(filePath || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    commitUrl?: string;
    commitSha?: string;
  } | null>(null);

  // Listen for content loaded event
  useEffect(() => {
    console.log('ContentEditor mounted with:', { initialContent, filePath });

    const handleContentLoaded = (event: CustomEvent<{ content: string, path: string }>) => {
      console.log('Content loaded event received:', event.detail);
      setContent(event.detail.content);
      setPath(event.detail.path);
    };

    document.addEventListener('content-loaded', handleContentLoaded as EventListener);

    return () => {
      document.removeEventListener('content-loaded', handleContentLoaded as EventListener);
    };
  }, []);

  // If initialContent or filePath are updated after initial render
  useEffect(() => {
    if (initialContent && initialContent !== content) {
      setContent(initialContent);
    }
    if (filePath && filePath !== path) {
      setPath(filePath);
    }
  }, [initialContent, filePath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await updateContent({
        content,
        path,
        message: `Update ${path} via content editor`
      })

      // Create GitHub commit URL
      const commitUrl = response.commit ?
        `https://github.com/ishafiul/cms_test/commit/${response.commit}` :
        undefined;

      setResult({
        success: true,
        commitSha: response.commit,
        commitUrl
      });

      // Update preview
      document.dispatchEvent(new CustomEvent('content-updated', {
        detail: { content }
      }));
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-editor">
      <h2>Edit Content</h2>
      <p>Editing: <code>{path || filePath}</code></p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="editor-textarea"
            disabled={isSubmitting}
            placeholder="Content will appear here when loaded..."
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="submit-button"
          >
            {isSubmitting ? 'Saving to GitHub...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <div>
              <p>Successfully saved! The changes have been committed to GitHub.</p>
              {result.commitUrl && (
                <p>
                  <a
                    href={result.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="commit-link"
                  >
                    View commit on GitHub ({result.commitSha?.substring(0, 7)})
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p>Error: {result.error}</p>
          )}
        </div>
      )}

      <style>{`
        .content-editor {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .editor-textarea {
          width: 100%;
          font-family: monospace;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
          line-height: 1.5;
        }

        .form-actions {
          margin-top: 20px;
        }

        .submit-button {
          padding: 10px 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }

        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .result {
          margin-top: 20px;
          padding: 15px;
          border-radius: 4px;
        }

        .success {
          background-color: #d4edda;
          color: #155724;
        }

        .error {
          background-color: #f8d7da;
          color: #721c24;
        }

        .commit-link {
          color: #0070f3;
          text-decoration: none;
          font-weight: 500;
        }

        .commit-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
