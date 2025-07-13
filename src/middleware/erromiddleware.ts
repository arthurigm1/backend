import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Se for um erro customizado (ApiError)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Erros inesperados (500)
  res.status(500).json({
    success: false,
    message: "Ocorreu um erro inesperado",
  });
};
