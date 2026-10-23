export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback;
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string> } } }).response;
  if (response?.data?.message) return response.data.message;
  if (response?.data?.errors) return Object.values(response.data.errors).join(" ");
  return error instanceof Error ? error.message : fallback;
};
