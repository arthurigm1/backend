// src/rotas/index.ts
import { Router } from "express";
import usuarioRoutes from "./usuario/usuario";
import empresaRoutes from "./empresa/empresa";

const router = Router();

router.use("/usuario", usuarioRoutes); // => /usuario
router.use("/empresa", empresaRoutes); // => /empresa

export default router;
