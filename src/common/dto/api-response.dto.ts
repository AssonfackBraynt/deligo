export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export function ok<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}
