import { auth } from '@clerk/nextjs/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function apiClient(path: string, options: RequestInit = {}) {
  const { getToken } = await auth();
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${BACKEND_URL}/api${path}`, {
    ...options,
    headers,
  });
}
