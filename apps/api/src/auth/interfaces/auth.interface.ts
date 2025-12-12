export interface UserResponse {
  id: string;
  email: string;
  name: string;
  profilePicture?: string | null;
}

export interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
}

export interface AuthResponse {
  access_token: string;
  refreshToken: string;
  expiresAt: Date;
  user: UserResponse;
}

export interface JwtPayload {
  sub: string; // This is the user id
  id: string; // Alias for sub for convenience
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}
