export enum LongGameErrorCode {
  BadRequest = 40000,
  Unauthorized = 40100,
  SessionExpired = 40101,
  SessionInvalid = 40102,
  Forbidden = 40300,
  NotFound = 40400,
  Conflict = 40900,
  InternalServerError = 50000,
  Unknown = 0,
}

export class LongGameError extends Error {
  static Code = LongGameErrorCode;
  name = 'LongGameError';

  static isInstance = (err: unknown): err is LongGameError => {
    if (err instanceof LongGameError) return true;
    if (err instanceof Error && err.name === 'LongGameError') return true;
    return false;
  };

  static isRpcInstance = (err: unknown) => {
    if (
      typeof err === 'object' &&
      (err as any).name === 'Error' &&
      !!(err as any).message &&
      (err as any).message.startsWith('LongGameError: ')
    )
      return true;

    return false;
  };

  static fromInstanceOrRpc = (err: unknown): LongGameError => {
    if (LongGameError.isInstance(err)) return err;
    if (
      err &&
      err instanceof Error &&
      'code' in err &&
      typeof err.code === 'number'
    ) {
      return new LongGameError(err.code, err.message);
    }
    if (err && err instanceof Error) {
      const code = /\(code: (\d+)\)/.exec(err.message);
      if (code) {
        return new LongGameError(Number(code[1]), err.message);
      }
    }
    return new LongGameError(LongGameErrorCode.Unknown, String(err));
  };

  static fromResponse = (res: Response): LongGameError | null => {
    if (res.ok) {
      return null;
    }
    const code = Number(res.headers.get('X-Long-Game-Error')) || 0;
    const message = res.headers.get('X-Long-Game-Message') || 'Unknown error';
    return new LongGameError(code, message);
  };

  static throwIfError = (res: Response): void => {
    const error = LongGameError.fromResponse(res);
    if (error) {
      throw error;
    }
  };

  static wrap = (err: Error): LongGameError => {
    if (LongGameError.isInstance(err)) {
      return err;
    }
    return new LongGameError(LongGameErrorCode.Unknown, err.message, err);
  };

  constructor(
    public code: LongGameErrorCode,
    message?: string,
    cause?: unknown,
  ) {
    // @ts-ignore
    super(message ? `${message} (code: ${code})` : `Error (code: ${code})`, {
      cause,
    });
    this.name = 'LongGameError';
    this.code = code;
  }

  get statusCode() {
    return Math.floor(this.code / 100);
  }

  get body() {
    return { code: this.code, message: this.message };
  }

  get headers() {
    return {
      'X-Long-Game-Error': this.code.toString(),
      'X-Long-Game-Message': this.message,
    };
  }

  toResponse = (): Response =>
    new Response(JSON.stringify(this.body), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
    });
}
