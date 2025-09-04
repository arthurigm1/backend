import { Router } from "express";
import { UsuarioController } from "../../controller/Usuario/UsuarioController";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
const usuarioController = new UsuarioController();

// Rotas públicas
router.post("/registro", usuarioController.createWithCompany);
router.post("/login", usuarioController.login);
router.post("/login-inquilino", usuarioController.loginInquilino);
router.post("/solicitar-redefinicao-senha", usuarioController.solicitarRedefinicaoSenha);


// Rotas protegidas
router.post("/criar-inquilino", authenticateJWT, usuarioController.createTenant);
router.get("/empresa/usuarios", authenticateJWT, usuarioController.listarUsuariosDaEmpresa);
router.get("/inquilinos", authenticateJWT, usuarioController.listarInquilinos);
router.get("/id/:id", authenticateJWT, usuarioController.buscarPorId);
router.post("/redefinir-senha", authenticateJWT,usuarioController.redefinirSenha);

export default router;
