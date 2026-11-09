// Small helpers around the access token kept in localStorage.
// They are plain functions (not a service) so the HTTP interceptor can use them
// without injecting AuthService, which itself uses HttpClient.

const TOKEN_KEY = 'luv2shop.accessToken';

export interface TokenPayload {
  sub: string;
  exp: number;
  roles?: string[];
}

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage can be unavailable (private mode); the session then lasts until reload
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as TokenPayload;
  } catch {
    return null;
  }
}

/** Returns the stored token if it exists and has not expired yet. */
export function validToken(): string | null {
  const token = readToken();
  const payload = token ? decodeToken(token) : null;
  if (!token || !payload || payload.exp * 1000 <= Date.now()) {
    return null;
  }
  return token;
}
