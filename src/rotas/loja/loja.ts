import { Router } from "express";
import { UsuarioController } from "../../controller/Usuario/UsuarioController";
import { verifyToken } from "../../utils/jwt";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

router.get("/criar-loja");
export default router;
