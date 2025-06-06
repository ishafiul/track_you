// API client for the Hono server
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

interface UpdateRequest {
  content: string;
  path: string;
  message?: string;
}

interface ContentResponse {
  content: string;
  sha: string;
  path: string;
}

interface UpdateResponse {
  success: boolean;
  sha?: string;
  commit?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function getContent(path: string): Promise<ContentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/content?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch content');
  }
  
  return data;
}

export async function updateContent(request: UpdateRequest): Promise<UpdateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update content');
  }
  
  return data;
} 