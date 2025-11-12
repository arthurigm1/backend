import { Request, Response } from "express";
import { FaturaService } from "../../service/Fatura/FaturaService";
import { 
  gerarFaturasMensaisSchema, 
  filtrosFaturaSchema, 
  atualizarStatusFaturaSchema,
  faturaIdSchema 
} from "../../schema/Fatura.schema";
import { SUCESSO } from "../../constants/sucesso";

export class FaturaController {
  private faturaService: FaturaService;

  constructor() {
    this.faturaService = new FaturaService();
  }

  /**
   * Gera faturas mensais para todos os contratos ativos
   * POST /fatura/gerar-mensais
   */
  async gerarFaturasMensais(req: Request, res: Response) {
    try {
      const dadosValidados = gerarFaturasMensaisSchema.parse(req.body);
      
      const faturasGeradas = await this.faturaService.gerarFaturasMensais(dadosValidados);
      
      return res.status(201).json({
        ...SUCESSO.FATURA_GERADA,
        data: {
          faturasGeradas: faturasGeradas.length,
          faturas: faturasGeradas,
          mesReferencia: dadosValidados.mesReferencia,
          anoReferencia: dadosValidados.anoReferencia
        }
      });
    } catch (error: any) {
      console.error("Erro ao gerar faturas mensais:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor",
        detalhes: error.message
      });
    }
  }

  /**
   * Lista faturas com filtros e paginação
   * GET /fatura
   */
  async listarFaturas(req: Request, res: Response) {
    try {
      const filtrosValidados = filtrosFaturaSchema.parse(req.query);
      
      const resultado = await this.faturaService.listarFaturas(filtrosValidados);
      
      return res.status(200).json({
        ...SUCESSO.LISTAGEM_SUCESSO,
        data: resultado
      });
    } catch (error: any) {
      console.error("Erro ao listar faturas:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor",
        detalhes: error.message
      });
    }
  }

  /**
   * Busca fatura por ID
   * GET /fatura/:id
   */
  async buscarFaturaPorId(req: Request, res: Response) {
    try {
      const { id } = faturaIdSchema.parse(req.params);
      
      const fatura = await this.faturaService.buscarFaturaPorId(id);
      
      if (!fatura) {
        return res.status(404).json({
          erro: "Fatura não encontrada",
          detalhes: "A fatura solicitada não existe"
        });
      }
      
      return res.status(200).json({
        ...SUCESSO.BUSCA_SUCESSO,
        data: fatura
      });
    } catch (error: any) {
      console.error("Erro ao buscar fatura:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor",
        detalhes: error.message
      });
    }
  }

  /**
   * Atualiza status da fatura
   * PATCH /fatura/:id/status
   */
  async atualizarStatusFatura(req: Request, res: Response) {
    try {
      const { id } = faturaIdSchema.parse(req.params);
      const { status } = atualizarStatusFaturaSchema.parse(req.body);
      
      const faturaAtualizada = await this.faturaService.atualizarStatusFatura(id, status);
      
      return res.status(200).json({
        ...SUCESSO.ATUALIZACAO_SUCESSO,
        data: faturaAtualizada
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status da fatura:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor",
        detalhes: error.message
      });
    }
  }

  /**
   * Lista faturas de um contrato específico
   * GET /fatura/contrato/:contratoId
   */
  async listarFaturasPorContrato(req: Request, res: Response) {
    try {
      const { contratoId } = req.params;
      const filtros = filtrosFaturaSchema.parse({
        ...req.query,
        contratoId
      });
      
      const resultado = await this.faturaService.listarFaturas(filtros);
      
      return res.status(200).json({
        ...SUCESSO.LISTAGEM_SUCESSO,
        data: resultado
      });
    } catch (error: any) {
      console.error("Erro ao listar faturas do contrato:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor",
        detalhes: error.message
      });
    }
  }

  /**
   * Busca detalhes completos da fatura
   * GET /fatura/:id/detalhes
   */
  async buscarDetalhesCompletos(req: Request, res: Response) {
    try {
      const { id } = faturaIdSchema.parse(req.params);
      
      const detalhes = await this.faturaService.buscarDetalhesCompletos(id);
      
      if (!detalhes) {
        return res.status(404).json({
          erro: "Fatura não encontrada",
          detalhes: "A fatura com o ID fornecido não foi encontrada"
        });
      }
      
      return res.status(200).json({
        ...SUCESSO.BUSCA_SUCESSO,
        data: detalhes
      });
    } catch (error: any) {
      console.error("Erro ao buscar detalhes da fatura:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor",
        detalhes: error.message
      });
    }
  }

  /**
   * Envia a fatura do inquilino por email
   * POST /fatura/:id/enviar-email
   */
  async enviarFaturaPorEmail(req: Request, res: Response) {
    try {
      const { id } = faturaIdSchema.parse(req.params);

      const resultado = await this.faturaService.enviarFaturaPorEmail(id);

      return res.status(200).json({
        sucesso: true,
        mensagem: "Email de fatura enviado com sucesso",
        data: resultado
      });
    } catch (error: any) {
      console.error("Erro ao enviar fatura por email:", error);
      return res.status(500).json({
        erro: "Erro interno do servidor",
        detalhes: error.message
      });
    }
  }
}