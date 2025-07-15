import { Router } from "express";
import { UsuarioController } from "../../controller/Usuario/UsuarioController";
import { verifyToken } from "../../utils/jwt";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
const usuariocontroller = new UsuarioController();

router.post("/", usuariocontroller.create);
router.post("/login", usuariocontroller.login);
router.get("/a", authenticateJWT, usuariocontroller.teste);
export default router;
