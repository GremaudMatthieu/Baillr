const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function fetchWithAuth(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {},
) {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(`${BACKEND_URL}/api${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let message = `Request failed: ${response.status}`;
    if (contentType?.includes("application/json")) {
      const error = (await response.json()) as { message?: string };
      if (error.message) {
        message = error.message;
      }
    }
    throw new Error(message);
  }
  return response;
}
