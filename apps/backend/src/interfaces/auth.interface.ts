import { Role, OtpType } from "@repo/database";

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  isVerified: boolean;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  mandiName?: string;
}

export interface RoleRegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface SendOtpInput {
  identifier: string;
  type: OtpType;
}

export interface VerifyOtpInput {
  identifier: string;
  code: string;
  type: OtpType;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  token: string;
  newPassword: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  message?: string;
}
