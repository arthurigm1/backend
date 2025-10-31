import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import prismaClient from "../prisma/PrismaClient";

// Garante que o usuário autenticado está ativo e não é VISITANTE
export const requireActiveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUser = req.user;

    if (!authUser) {
      return next(new ApiError(401, "Usuário não autenticado"));
    }

    const usuario = await prismaClient.usuario.findUnique({
      where: { id: authUser.id },
      select: { id: true, ativo: true, tipo: true }
    });

    if (!usuario) {
      return next(new ApiError(401, "Usuário não encontrado"));
    }

    if (usuario.ativo === false) {
      return next(new ApiError(403, "Usuário desativado. Contate o administrador."));
    }

    if (usuario.tipo === 'VISITANTE') {
      return next(new ApiError(403, "Visitantes não têm permissão para esta ação"));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};