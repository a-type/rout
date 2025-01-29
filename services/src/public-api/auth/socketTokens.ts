import { Session } from '@a-type/auth';
import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

export function getSocketToken(
  session: Session,
  gameSessionId: string,
  secret: string,
) {
  const builder = new SignJWT({
    sub: session.userId,
    aud: gameSessionId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setSubject(session.userId)
    .setAudience(gameSessionId);
  return builder.sign(encoder.encode(secret));
}

export async function verifySocketToken(token: string, secret: string) {
  const result = await jwtVerify(token, encoder.encode(secret));
  return result.payload as { sub: string; aud: string };
}
