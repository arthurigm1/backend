// src/rotas/index.ts
import { Router } from "express";
import usuarioRoutes from "./usuario/usuario";

const router = Router();

router.use("/usuario", usuarioRoutes); // => /usuario

export default router;
