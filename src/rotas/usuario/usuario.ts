import { Router } from "express";
import { UsuarioController } from "../../controller/Usuario/UsuarioController";

const router = Router();
const usuariocontroller = new UsuarioController();

router.post("/", usuariocontroller.create);
router.post("/login", usuariocontroller.login);
export default router;
