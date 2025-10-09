import { Request, Response } from 'express';
import { EFIService } from '../services/EFIService';
import { IEFICobranca, IEFIOneStepCharge } from '../interface/EFI/EFI';

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

 
}