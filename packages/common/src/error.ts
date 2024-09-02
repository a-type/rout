export enum LongGameErrorCode {
  BadRequest = 40000,
  Unauthorized = 40100,
  SessionExpired = 40101,
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

  static fromResponse = (res: Response): LongGameError => {
    const code = Number(res.headers.get('X-LongGame-Error')) || 0;
    const message = res.headers.get('X-LongGame-Message') || 'Unknown error';
    return new LongGameError(code, message);
  };

  constructor(
    public code: LongGameErrorCode,
    message: string = `LongGameError: ${code}`,
    cause?: unknown,
  ) {
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
      'X-LongGame-Error': this.code.toString(),
      'X-LongGame-Message': this.message,
    };
  }
}
