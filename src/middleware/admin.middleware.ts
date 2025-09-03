// src/middleware/admin.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  
  if (!user) {
    return next(new ApiError(401, "Usuário não autenticado"));
  }
  
  if (user.tipo !== 'ADMIN_EMPRESA') {
    return next(new ApiError(403, "Acesso negado. Apenas administradores podem realizar esta ação"));
  }
  
  next();
};