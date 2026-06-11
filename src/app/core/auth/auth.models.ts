export interface RegisterRequest {
  email: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export interface InfoResponse {
  email: string;
  isEmailConfirmed: boolean;
}

export interface UpdateInfoRequest {
  newEmail?: string;
  newPassword?: string;
  oldPassword?: string;
}

export interface MeResponse {
  userId: string | null;
  farmId: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface ErrorProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export interface IdentityErrorResponse {
  errors?: { code: string; description: string }[];
  message?: string;
}
