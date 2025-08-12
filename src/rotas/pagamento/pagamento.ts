import { Router } from "express";
import { PagamentoController } from "../../controller/Pagamento/PagamentoController";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
const pagamentoController = new PagamentoController();

// Todas as rotas de pagamento requerem autenticação
router.use(authenticateJWT);

// Criar novo pagamento (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.post("/criar", pagamentoController.create);

// Buscar pagamento por ID
router.get("/id/:id", pagamentoController.buscarPorId);

// Listar pagamentos por usuário
router.get("/usuario/:usuarioId", pagamentoController.listarPorUsuario);

// Listar meus pagamentos (usuário logado)
router.get("/meus-pagamentos", pagamentoController.meusPagamentos);

// Listar pagamentos por empresa (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.get("/empresa/:empresaId", pagamentoController.listarPorEmpresa);

// Listar pagamentos vencidos
router.get("/vencidos", pagamentoController.listarVencidos);

// Marcar pagamento como pago
router.patch("/marcar-pago/:id", pagamentoController.marcarComoPago);

// Atualizar pagamento (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.patch("/atualizar/:id", pagamentoController.atualizar);

// Obter estatísticas de pagamentos (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.get("/estatisticas/:empresaId", pagamentoController.obterEstatisticas);

export default router;