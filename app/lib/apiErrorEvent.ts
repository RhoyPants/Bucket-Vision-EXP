export const apiErrorEventName = "bucket-vision:api-error";

export type ApiErrorDetail = {
  title: string;
  message: string;
  status?: number;
  method?: string;
  path?: string;
  redirectTo?: string;
};

export const publishApiError = (detail: ApiErrorDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(apiErrorEventName, { detail }));
};
