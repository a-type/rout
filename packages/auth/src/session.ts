import { getIronSession } from 'iron-session';

const SESSION_COOKIE = 'lg-session';

const SESSION_SECRET = process.env.SESSION_SECRET!;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set');
}

export interface Session {
  userId: string;
}

export function getSession(req: Request, res: Response) {
  return getIronSession<Session>(req, res, {
    cookieName: SESSION_COOKIE,
    password: SESSION_SECRET,
  });
}
