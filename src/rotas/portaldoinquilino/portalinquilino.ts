import { Router } from "express";
import { PortalInquilinoController } from "../../controller/Usuario/PortalInquilinoController";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
const portalInquilinoController = new PortalInquilinoController();

// Middleware de autenticação para todas as rotas do portal do inquilino
router.use(authenticateJWT);

/**
 * @route GET /portal-inquilino/dados
 * @desc Busca dados completos do portal do inquilino
 * @access Inquilino autenticado
 * @returns {IPortalInquilinoData} Dados completos do portal (faturas, lojas, notificações, resumo financeiro)
 */
router.get("/dados", portalInquilinoController.buscarDadosPortal.bind(portalInquilinoController));

/**
 * @route GET /portal-inquilino/resumo
 * @desc Busca resumo rápido do inquilino para dashboard
 * @access Inquilino autenticado
 * @returns Resumo financeiro, notificações não lidas e total de lojas
 */
router.get("/resumo", portalInquilinoController.buscarResumoRapido.bind(portalInquilinoController));

/**
 * @route GET /portal-inquilino/faturas
 * @desc Busca faturas por período específico
 * @access Inquilino autenticado
 * @query mes - Mês de referência (1-12)
 * @query ano - Ano de referência
 * @example GET /portal-inquilino/faturas?mes=12&ano=2024
 */
router.get("/faturas", portalInquilinoController.buscarFaturasPorPeriodo.bind(portalInquilinoController));

/**
 * @route GET /portal-inquilino/fatura-efi/:faturaId
 * @desc Busca uma fatura específica com dados EFI completos para pagamento
 * @access Inquilino autenticado
 * @param faturaId - ID da fatura
 * @returns Fatura com dados completos de pagamento EFI (QR Code, PIX Copia e Cola, etc.)
 * @example GET /portal-inquilino/fatura-efi/123e4567-e89b-12d3-a456-426614174000
 */
router.get("/fatura-efi/:efiCobrancaId", portalInquilinoController.buscarFaturaComEFIPorId.bind(portalInquilinoController));

/**
 * @route PATCH /portal-inquilino/notificacao/:notificacaoId/lida
 * @desc Marca uma notificação como lida
 * @access Inquilino autenticado
 * @param notificacaoId - ID da notificação
 */
router.patch("/notificacao/:notificacaoId/lida", portalInquilinoController.marcarNotificacaoComoLida.bind(portalInquilinoController));

export default router;