const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

export async function api<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// Upload file (for quality assessment images)
export async function apiUpload<T = any>(
  path: string,
  file: File,
  token: string,
  extraFields?: Record<string, string>,
): Promise<T> {
  const formData = new FormData();
  formData.append('image', file);

  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || `Upload error: ${res.status}`);
  }

  return res.json();
}
