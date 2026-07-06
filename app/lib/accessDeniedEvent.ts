export const accessDeniedEventName = "bucket-vision:access-denied";

export type AccessDeniedDetail = {
  action: string;
  resource: string;
  message?: string;
};
