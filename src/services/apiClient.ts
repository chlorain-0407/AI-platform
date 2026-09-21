import { authService } from './authService';

/**
 * Universal API Fetch Client
 * Automatically attaches Authorization: Bearer <token> and credentials: 'include'
 * to ensure 100% reliable authenticated communication inside iframes and cross-site contexts.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authService.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
