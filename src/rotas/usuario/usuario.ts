import { Router } from "express";
import { UsuarioController } from "../../controller/Usuario/UsuarioController";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
const usuarioController = new UsuarioController();

// Rotas públicas
router.post("/registro", usuarioController.createWithCompany);
router.post("/login", usuarioController.login);
router.post("/solicitar-redefinicao-senha", usuarioController.solicitarRedefinicaoSenha);
router.post("/redefinir-senha", usuarioController.redefinirSenha);

// Rotas protegidas
router.post("/criar-usuario", authenticateJWT, usuarioController.create);
router.post("/criar-inquilino", authenticateJWT, usuarioController.createTenant);
router.get("/empresa/usuarios", authenticateJWT, usuarioController.listarUsuariosDaEmpresa);
router.get("/id/:id", authenticateJWT, usuarioController.buscarPorId);
router.get("/teste", authenticateJWT, usuarioController.teste);

export default router;
