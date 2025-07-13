import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const secretFromEnv = process.env.SEGREDO_JWT;
if (!secretFromEnv) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}
const JWT_SECRET = secretFromEnv; // agora garantido como string

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function generateRefreshToken(payload: { id: string }): string {
  return jwt.sign({ id: payload.id }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
