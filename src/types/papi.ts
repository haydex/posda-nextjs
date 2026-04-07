export type PapiListResponse<T> = {
  data: T[];
  meta?: {
    count?: number;
  };
};

export type PapiItemResponse<T> = {
  data: T;
};

export type PapiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};
