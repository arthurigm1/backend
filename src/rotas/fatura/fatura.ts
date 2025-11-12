import { Router } from "express";
import { FaturaController } from "../../controller/Fatura/FaturaController";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireActiveUser } from "../../middleware/active.middleware";

const router = Router();
const faturaController = new FaturaController();

// Middleware de autenticação para todas as rotas de fatura
router.use(authenticateJWT);
router.use(requireActiveUser);

/**
 * @route POST /fatura/gerar-mensais
 * @desc Gera faturas mensais para todos os contratos ativos
 * @body { mesReferencia: number, anoReferencia: number }
 * @example POST /fatura/gerar-mensais
 * Body: { "mesReferencia": 12, "anoReferencia": 2024 }
 */
router.post("/gerar-mensais", faturaController.gerarFaturasMensais.bind(faturaController));

/**
 * @route GET /fatura
 * @desc Lista faturas com filtros e paginação
 * @query contratoId?, mesReferencia?, anoReferencia?, status?, page?, limit?
 * @example GET /fatura?mesReferencia=12&anoReferencia=2024&page=1&limit=10
 */
router.get("/", faturaController.listarFaturas.bind(faturaController));

/**
 * @route GET /fatura/contrato/:contratoId
 * @desc Lista faturas de um contrato específico
 * @param contratoId - ID do contrato
 * @query mesReferencia?, anoReferencia?, status?, page?, limit?
 * @example GET /fatura/contrato/123e4567-e89b-12d3-a456-426614174000?page=1&limit=10
 */
router.get("/contrato/:contratoId", faturaController.listarFaturasPorContrato.bind(faturaController));

/**
 * @route GET /fatura/:id/detalhes
 * @desc Busca detalhes completos da fatura com informações relevantes
 * @param id - ID da fatura
 * @example GET /fatura/123e4567-e89b-12d3-a456-426614174000/detalhes
 */
router.get("/detalhes/:id", faturaController.buscarDetalhesCompletos.bind(faturaController));

/**
 * @route POST /fatura/:id/enviar-email
 * @desc Envia a fatura do inquilino por email (PIX/Boleto)
 * @param id - ID da fatura
 * @example POST /fatura/123e4567-e89b-12d3-a456-426614174000/enviar-email
 */
router.post("/:id/enviar-email", faturaController.enviarFaturaPorEmail.bind(faturaController));

/**
 * @route GET /fatura/:id
 * @desc Busca fatura por ID
 * @param id - ID da fatura
 * @example GET /fatura/123e4567-e89b-12d3-a456-426614174000
 */
router.get("/:id", faturaController.buscarFaturaPorId.bind(faturaController));

/**
 * @route PATCH /fatura/:id/status
 * @desc Atualiza status da fatura
 * @param id - ID da fatura
 * @body { status: StatusFatura }
 * @example PATCH /fatura/123e4567-e89b-12d3-a456-426614174000/status
 * Body: { "status": "PAGA" }
 */
router.patch("/:id/status", faturaController.atualizarStatusFatura.bind(faturaController));

export default router;