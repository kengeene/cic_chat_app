const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const toApiError = async (response) => {
  const payload = await response.json().catch(() => null);
  const { code = 'UNKNOWN_ERROR', message = 'Request failed' } = payload?.error ?? {};
  return new ApiError(response.status, code, message);
};

const send = (method, path, body) =>
  fetch(`${API_URL}/api${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server');
  });

const request = async (method, path, body) => {
  const response = await send(method, path, body);
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return null;
  return response.json();
};

export const apiClient = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
};
