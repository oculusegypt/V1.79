let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getAuthHeader(): Record<string, string> {
  if (_authToken) {
    return { Authorization: `Bearer ${_authToken}` };
  }
  return {};
}

export function getCredentialsOption(): RequestCredentials {
  return "include";
}
