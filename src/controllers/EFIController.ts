import { Request, Response } from 'express';
import { EFIService } from '../services/EFIService';
import { IEFICobranca, IEFIOneStepCharge } from '../interface/EFI/EFI';
import prismaClient from '../prisma/PrismaClient';
import { StatusFatura } from '../generated/prisma';

export class EFIController {
  private efiService: EFIService;

  constructor() {
    this.efiService = new EFIService();
  }

  /**
   * Cria uma cobrança one-step (boleto + PIX)
   */
  criarCobrancaOneStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const cobrancaData: IEFIOneStepCharge = req.body;

      // Validações básicas
      if (!cobrancaData.items || cobrancaData.items.length === 0) {
        res.status(400).json({
          erro: 'Campo obrigatório: items (deve conter pelo menos um item)'
        });
        return;
      }

      if (!cobrancaData.payment?.banking_billet) {
        res.status(400).json({
          erro: 'Campo obrigatório: payment.banking_billet'
        });
        return;
      }

      if (!cobrancaData.payment.banking_billet.customer?.name) {
        res.status(400).json({
          erro: 'Campo obrigatório: payment.banking_billet.customer.name'
        });
        return;
      }

      if (!cobrancaData.payment.banking_billet.customer?.email) {
        res.status(400).json({
          erro: 'Campo obrigatório: payment.banking_billet.customer.email'
        });
        return;
      }

      if (!cobrancaData.payment.banking_billet.expire_at) {
        res.status(400).json({
          erro: 'Campo obrigatório: payment.banking_billet.expire_at'
        });
        return;
      }

      // Validar formato da data de vencimento (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(cobrancaData.payment.banking_billet.expire_at)) {
        res.status(400).json({
          erro: 'Formato inválido para expire_at. Use YYYY-MM-DD'
        });
        return;
      }

      const resultado = await this.efiService.criarCobrancaOneStep(cobrancaData);
      
      res.status(201).json({
        sucesso: true,
        mensagem: 'Cobrança one-step criada com sucesso',
        dados: resultado
      });

    } catch (error: any) {
      console.error('Erro ao criar cobrança one-step:', error);
      
      res.status(500).json({
        erro: 'Erro interno do servidor ao criar cobrança one-step',
        detalhes: error.message || 'Erro desconhecido'
      });
    }
  };

  /**
   * Consulta cobrança por efiCobrancaId:
   * - Busca EFICobranca por ID e obtém o chargeId
   * - Consulta cobrança na EFI com chargeId
   * - Atualiza EFICobranca.status/total/payment
   * - Se status === 'paid' ou 'settled', marca fatura como PAGA
   */
  consultarCobrancaEAtualizarPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { efiCobrancaId } = req.params as { efiCobrancaId?: string };
      if (!efiCobrancaId) {
        res.status(400).json({ erro: 'efiCobrancaId é obrigatório' });
        return;
      }

      // Buscar EFICobranca por ID
      const efiCobranca = await prismaClient.eFICobranca.findUnique({ where: { id: efiCobrancaId } });
      if (!efiCobranca) {
        res.status(404).json({ erro: 'EFICobranca não encontrada para o id informado', efiCobrancaId });
        return;
      }

      if (typeof efiCobranca.chargeId !== 'number' || !efiCobranca.chargeId) {
        res.status(422).json({ erro: 'EFICobranca encontrada não possui chargeId associado', efiCobrancaId });
        return;
      }

      const chargeIdNum = efiCobranca.chargeId;

      // Consulta na EFI
      const consulta = await this.efiService.consultarCobrancaPorId(chargeIdNum);
      const dados = consulta?.data || consulta; // suporte a { code, data } ou diretamente data
      const statusEFI: string | undefined = dados?.status;
      const totalEFI: number | undefined = dados?.total;
      const paymentRaw: any = dados?.payment;

      if (!statusEFI) {
        res.status(502).json({ erro: 'Resposta da EFI sem status', detalhes: consulta });
        return;
      }

      // Determinar método de pagamento como string
      let paymentMethod: string | undefined = undefined;
      if (typeof paymentRaw === 'string') {
        paymentMethod = paymentRaw;
      } else if (paymentRaw && typeof paymentRaw === 'object' && typeof paymentRaw.method === 'string') {
        paymentMethod = paymentRaw.method;
      }

      // Atualizar EFICobranca
      const efiAtualizada = await prismaClient.eFICobranca.update({
        where: { id: efiCobranca.id },
        data: {
          status: statusEFI,
          total: typeof totalEFI === 'number' ? totalEFI : efiCobranca.total,
          payment: paymentMethod ?? efiCobranca.payment,
        }
      });

      // Se pago, atualizar fatura vinculada
      const isPago = statusEFI === 'paid' || statusEFI === 'settled';
      let faturaAtualizada: any = null;
      if (isPago) {
        const fatura = await prismaClient.fatura.findFirst({ where: { efiCobrancaId: efiCobranca.id } });
        if (fatura) {
          faturaAtualizada = await prismaClient.fatura.update({
            where: { id: fatura.id },
            data: { status: StatusFatura.PAGA }
          });
        }
      }

      res.status(200).json({
        sucesso: true,
        mensagem: isPago ? 'Pagamento confirmado/settled. Fatura atualizada para PAGA.' : 'Cobrança consultada. Status atualizado na EFICobranca.',
        efi: { ...dados, charge_id: chargeIdNum },
        efiCobranca: efiAtualizada,
        fatura: faturaAtualizada
      });
    } catch (error: any) {
      console.error('Erro ao consultar/atualizar cobrança EFI por efiCobrancaId:', error);
      res.status(500).json({
        erro: 'Erro interno ao consultar/atualizar cobrança EFI por efiCobrancaId',
        detalhes: error.message || 'Erro desconhecido'
      });
    }
  };
}