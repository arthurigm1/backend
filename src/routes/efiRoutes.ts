import { Router } from 'express';
import { EFIController } from '../controllers/EFIController';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
const efiController = new EFIController();

/**
 * @route POST /api/efi/charge/one-step
 * @desc Criar uma cobrança one-step (boleto bancário + PIX)
 * @access Private
 * @body {
 *   items: Array<{ name: string, value: number, amount: number }>,
 *   payment: {
 *     banking_billet: {
 *       customer: {
 *         name: string,
 *         cpf?: string,
 *         email: string,
 *         phone_number: string,
 *         address: {
 *           street: string,
 *           number: string,
 *           neighborhood: string,
 *           zipcode: string,
 *           city: string,
 *           state: string
 *         }
 *       },
 *       expire_at: string, // YYYY-MM-DD
 *       configurations?: {
 *         fine?: number,
 *         interest?: number
 *       },
 *       message?: string
 *     }
 *   }
 * }
 */
router.post('/charge/one-step', efiController.criarCobrancaOneStep);

/**
 * @route GET /api/efi/charge/:efiCobrancaId
 * @desc Consultar cobrança na EFI por efiCobrancaId (buscar chargeId no banco) e atualizar EFICobranca/Fatura
 * @access Private
 */
router.get('/charge/:efiCobrancaId', efiController.consultarCobrancaEAtualizarPorId);

/**
 * @route POST /api/efi/notification
 * @desc Recebe token de notificação da EFI e atualiza cobrança/fatura
 * @access Public
 * @body { notification: string }
 */
router.post('/notification', efiController.processarNotificacao);

/**
 * @route POST /api/efi/cobranca
 * @desc Criar uma nova cobrança PIX imediata
 * @access Private
 * @body {
 *   calendario: { expiracao: number },
 *   devedor: { cpf?: string, cnpj?: string, nome: string },
 *   valor: { original: string },
 *   chave: string,
 *   solicitacaoPagador?: string,
 *   infoAdicionais?: Array<{ nome: string, valor: string }>
 * }
 */


export default router;