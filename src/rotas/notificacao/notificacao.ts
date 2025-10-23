import { Router } from "express";
import { NotificacaoController } from "../../controller/Notificacao/NotificacaoController";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();
const notificacaoController = new NotificacaoController();

// Todas as rotas de notificação requerem autenticação
router.use(authenticateJWT);

// Criar nova notificação (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.post("/criar", notificacaoController.create);

// Listar notificações por usuário
router.get("/usuario/:usuarioId", notificacaoController.listarPorUsuario);

// Listar notificações não lidas do usuário logado
router.get("/nao-lidas", notificacaoController.listarNaoLidas);

// Contar notificações não lidas do usuário logado
router.get("/contar-nao-lidas", notificacaoController.contarNaoLidas);

// Marcar notificação como lida
router.patch("/marcar-lida/:id", notificacaoController.marcarComoLida);

// Marcar todas as notificações como lidas
router.patch("/marcar-todas-lidas", notificacaoController.marcarTodasComoLidas);

// Processar notificações de inadimplência (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.post("/processar-inadimplencia", notificacaoController.processarInadimplencia);

// Listar notificações por empresa (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.get("/empresa/:empresaId", notificacaoController.listarPorEmpresa);

// Obter estatísticas de notificações (apenas ADMIN_EMPRESA e FUNCIONARIO)
router.get("/estatisticas/:empresaId", notificacaoController.obterEstatisticas);

// Enviar notificações pré-definidas via sistema (apenas ADMIN_EMPRESA)
router.post("/enviar-sistema", requireAdmin, notificacaoController.enviarSistemaPredefinidas);

// Enviar notificações pré-definidas via email (apenas ADMIN_EMPRESA)
router.post("/enviar-email", requireAdmin, notificacaoController.enviarEmailPredefinidas);

export default router;