export interface AuthRequest {
  headers: Record<string, string>;
  user?: { userId: string };
}
