import { Router } from "express";
import { ContratoController } from "../../controller/Contrato/ContratoController";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();
const contratoController = new ContratoController();

// Todas as rotas de contrato requerem autenticação
router.use(authenticateJWT);

// Criar novo contrato (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.post("/criar", requireAdmin, contratoController.criarContrato);

// Listar contratos da empresa com paginação
// Query params: page (número da página), limit (itens por página), status, ativo, lojaId, inquilinoId, etc.
// Exemplo: GET /empresa?page=1&limit=10&status=ATIVO
router.get("/empresa", contratoController.listarContratosDaEmpresa);

// Buscar contrato por ID
router.get("/id/:id", contratoController.buscarContratoPorId);

// Atualizar contrato (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.put("/atualizar/:id", requireAdmin, contratoController.atualizarContrato);

// Rescindir contrato (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.patch("/rescindir/:id", requireAdmin, contratoController.rescindirContrato);

// Renovar contrato (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.patch("/renovar/:id", requireAdmin, contratoController.renovarContrato);

// Buscar contratos vencendo em X dias
router.get("/vencendo", contratoController.buscarContratosVencendoEm);

// Buscar contratos vencidos
router.get("/vencidos", contratoController.buscarContratosVencidos);

// Atualizar status de contratos vencidos (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.patch("/atualizar-status-vencidos", requireAdmin, contratoController.atualizarStatusContratosVencidos);

export default router;