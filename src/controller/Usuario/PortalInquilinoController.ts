import { Request, Response } from "express";
import { PortalInquilinoService } from "../../service/Usuario/PortalInquilinoService";
import { ApiError } from "../../utils/apiError";

export class PortalInquilinoController {
  private portalInquilinoService: PortalInquilinoService;

  constructor() {
    this.portalInquilinoService = new PortalInquilinoService();
  }

  /**
   * Busca dados completos do portal do inquilino
   */
  async buscarDadosPortal(req: Request, res: Response): Promise<void> {
    try {
      const inquilinoId = req.user?.id;

      if (!inquilinoId) {
        throw new ApiError(401, "ID do inquilino não encontrado");
      }

      const dadosPortal = await this.portalInquilinoService.buscarDadosPortalInquilino(inquilinoId);

      res.status(200).json({
        success: true,
        message: "Dados do portal obtidos com sucesso",
        data: dadosPortal
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error("Erro ao buscar dados do portal:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  }

  /**
   * Busca faturas por período específico
   */
  async buscarFaturasPorPeriodo(req: Request, res: Response): Promise<void> {
    try {
      const inquilinoId = req.user?.id;
      const { mes, ano } = req.query;

      if (!inquilinoId) {
        throw new ApiError(401, "ID do inquilino não encontrado");
      }

      if (!mes || !ano) {
        throw new ApiError(400, "Mês e ano são obrigatórios");
      }

      const mesReferencia = parseInt(mes as string);
      const anoReferencia = parseInt(ano as string);

      if (mesReferencia < 1 || mesReferencia > 12) {
        throw new ApiError(400, "Mês deve estar entre 1 e 12");
      }

      if (anoReferencia < 2000 || anoReferencia > 2100) {
        throw new ApiError(400, "Ano inválido");
      }

      const faturas = await this.portalInquilinoService.buscarFaturasPorPeriodo(
        inquilinoId, 
        mesReferencia, 
        anoReferencia
      );

      res.status(200).json({
        success: true,
        message: "Faturas obtidas com sucesso",
        data: faturas
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error("Erro ao buscar faturas por período:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  }

  /**
   * Marca notificação como lida
   */
  async marcarNotificacaoComoLida(req: Request, res: Response): Promise<void> {
    try {
      const inquilinoId = req.user?.id;
      const { notificacaoId } = req.params;

      if (!inquilinoId) {
        throw new ApiError(401, "ID do inquilino não encontrado");
      }

      if (!notificacaoId) {
        throw new ApiError(400, "ID da notificação é obrigatório");
      }

      await this.portalInquilinoService.marcarNotificacaoComoLida(notificacaoId, inquilinoId);

      res.status(200).json({
        success: true,
        message: "Notificação marcada como lida"
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error("Erro ao marcar notificação como lida:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  }

  /**
   * Busca resumo rápido do inquilino (para dashboard)
   */
  async buscarResumoRapido(req: Request, res: Response): Promise<void> {
    try {
      const inquilinoId = req.user?.id;

      if (!inquilinoId) {
        throw new ApiError(401, "ID do inquilino não encontrado");
      }

      const dadosPortal = await this.portalInquilinoService.buscarDadosPortalInquilino(inquilinoId);

      // Retornar apenas resumo financeiro e notificações não lidas
      const resumoRapido = {
        resumoFinanceiro: dadosPortal.resumoFinanceiro,
        notificacoes: dadosPortal.notificacoes.filter(n => !n.lida).slice(0, 5),
        totalLojas: dadosPortal.lojas.length
      };

      res.status(200).json({
        success: true,
        message: "Resumo obtido com sucesso",
        data: resumoRapido
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error("Erro ao buscar resumo rápido:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  }
}