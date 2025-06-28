// errors.ts

export function isApiError(
    error: unknown
  ): error is { response: { status: number; data: { message: string } } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as {
        response?: {
          status?: unknown;
          data?: { message?: unknown };
        };
      }).response?.status === 'number' &&
      typeof (
        error as {
          response?: {
            status?: unknown;
            data?: { message?: unknown };
          };
        }
      ).response?.data?.message === 'string'
    );
  }  