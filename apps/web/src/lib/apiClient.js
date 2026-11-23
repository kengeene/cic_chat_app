import ky, { isHTTPError, isNetworkError } from 'ky';

/** Replaces ky's generic messages with the server's `{ error: { message } }` or a readable network error. */
const applyServerMessage = ({ error }) => {
  if (isHTTPError(error) && error.data?.error?.message) error.message = error.data.error.message;
  if (isNetworkError(error)) error.message = 'Cannot reach the server';
  return error;
};

export const api = ky.create({
  baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/`,
  credentials: 'include',
  retry: 0, // React Query owns retries
  hooks: { beforeError: [applyServerMessage] },
});
