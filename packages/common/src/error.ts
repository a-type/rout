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

  static isInstance = (err: unknown): err is LongGameError =>
    err instanceof LongGameError ||
    (!!err &&
      typeof err === 'object' &&
      'name' in err &&
      err.name === 'LongGameError');

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

  constructor(
    public code: LongGameErrorCode,
    message: string = `LongGameError: ${code}`,
    cause?: unknown,
  ) {
    // @ts-ignore
    super(message, { cause });
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
}
