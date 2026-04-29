export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error?: unknown;
};