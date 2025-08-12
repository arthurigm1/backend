import { Router } from "express";
import { LojaController } from "../../controller/Loja/LojaController";
import { authenticateJWT } from "../../middleware/auth.middleware";


const router = Router();
const lojaController = new LojaController();

// Todas as rotas de loja requerem autenticação
router.use(authenticateJWT);


// Criar nova loja (apenas ADMIN_EMPRESA)
router.post("/criar", lojaController.create);

// Listar lojas da empresa
router.get("/empresa/:empresaId", lojaController.listarLojasDaEmpresa);

// Buscar loja por ID
router.get("/id/:id", lojaController.buscarPorId);

// Vincular inquilino à loja (apenas ADMIN_EMPRESA)
router.post("/vincular-inquilino", lojaController.vincularInquilino);

// Atualizar status da loja (apenas ADMIN_EMPRESA)
router.patch("/status/:id", lojaController.atualizarStatus);

export default router;
