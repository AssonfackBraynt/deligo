const API_PORT = 4000;
const API_PATH = '/api/v1';

function getBaseUrl(): string {
  if (typeof window === 'undefined') return `http://localhost:${API_PORT}${API_PATH}`;
  return `http://${window.location.hostname}:${API_PORT}${API_PATH}`;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('deligo-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: string[],
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, { ...init, headers });

  const body = (await res.json()) as {
    success?: boolean;
    data?: T;
    message?: string | string[];
    error?: string;
  };

  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deligo-auth');
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/login?next=${next}`;
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const raw = body.message;
    const errors = Array.isArray(raw) ? raw : undefined;
    let message: string;
    if (Array.isArray(raw)) {
      message = raw[0] ?? 'Something went wrong';
    } else if (typeof raw === 'string') {
      message = raw;
    } else {
      // Backend throws HttpException with a body like { success, error: { code, message } }
      const e = body.error as unknown;
      if (typeof e === 'string') {
        message = e;
      } else if (e && typeof e === 'object' && typeof (e as Record<string, unknown>).message === 'string') {
        message = (e as { message: string }).message;
      } else {
        message = 'Something went wrong';
      }
    }
    throw new ApiError(res.status, message, errors, body);
  }

  return body.data as T;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, { method: 'POST', headers, body: formData });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deligo-auth');
      window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(401, 'Unauthorized');
  }

  const body = (await res.json()) as { success?: boolean; data?: T; message?: string | string[]; error?: string };
  if (!res.ok) {
    const raw = body.message;
    throw new ApiError(res.status, Array.isArray(raw) ? raw[0] : (raw ?? body.error ?? 'Upload failed'));
  }
  return body.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),
};
