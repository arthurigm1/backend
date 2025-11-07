import { Router } from "express";
import { UsuarioController } from "../../controller/Usuario/UsuarioController";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireActiveUser } from "../../middleware/active.middleware";


const router = Router();
const usuarioController = new UsuarioController();

// Rotas públicas
router.post("/registro", usuarioController.createWithCompany);
router.post("/login", usuarioController.login);
router.post("/login-inquilino", usuarioController.loginInquilino);
router.post("/solicitar-redefinicao-senha", usuarioController.solicitarRedefinicaoSenha);
router.post("/validar-redefinicao-senha", usuarioController.redefinirSenha);


// Rotas protegidas
router.post("/criar-inquilino", authenticateJWT, requireActiveUser, usuarioController.createTenant);
router.get("/empresa/usuarios", authenticateJWT, requireActiveUser, usuarioController.listarUsuariosDaEmpresa);
router.get("/inquilinos", authenticateJWT, requireActiveUser, usuarioController.listarInquilinos);
router.get("/id/:id", authenticateJWT, requireActiveUser, usuarioController.buscarPorId);
router.post("/redefinir-senha", authenticateJWT, requireActiveUser, usuarioController.alterarSenha);

// Desativar usuário (apenas usuários autenticados; controle de permissão no service)
router.patch("/desativar/:id", authenticateJWT, requireActiveUser, usuarioController.desativarUsuario);

// Ativar usuário (apenas usuários autenticados; controle de permissão no service)
router.patch("/ativar/:id", authenticateJWT, requireActiveUser, usuarioController.ativarUsuario);


export default router;
