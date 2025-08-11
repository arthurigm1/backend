// src/middlewares/authenticateJWT.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { UserPayload } from "../utils/express";

// TypeScript: garante que a variável existe
const JWT_SECRET = process.env.SEGREDO_JWT;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido no .env");
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Token de autenticação não fornecido"));
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err || !payload) {
      return next(new ApiError(403, "Token inválido ou expirado"));
    }
    req.user = payload as UserPayload; // Type assertion to ensure payload matches UserPayload type
    next();
  });
};
