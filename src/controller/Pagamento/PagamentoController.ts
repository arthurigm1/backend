import { Request, Response } from "express";
import { PagamentoService } from "../../service/Pagamento/PagamentoService";
import { criarPagamentoSchema, atualizarPagamentoSchema, marcarComoPagoSchema } from "../../schema/Pagamento.schema";

const pagamentoService = new PagamentoService();

export class PagamentoController {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarPagamentoSchema.safeParse(req.body);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }

      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamento = await pagamentoService.criarPagamento(data.data, usuarioId);
      return res.status(201).json({
        sucesso: true,
        mensagem: "Pagamento criado com sucesso",
        pagamento: pagamento,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamento = await pagamentoService.buscarPagamentoPorId(id, usuarioId);
      return res.status(200).json({
        sucesso: true,
        pagamento: pagamento,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async listarPorUsuario(req: Request, res: Response): Promise<Response> {
    try {
      const { usuarioId } = req.params;
      const usuarioSolicitante = req.user?.id;
      
      if (!usuarioSolicitante) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamentos = await pagamentoService.listarPagamentosPorUsuario(usuarioId, usuarioSolicitante);
      return res.status(200).json({
        sucesso: true,
        pagamentos: pagamentos,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async listarPorEmpresa(req: Request, res: Response): Promise<Response> {
    try {
      const { empresaId } = req.params;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamentos = await pagamentoService.listarPagamentosPorEmpresa(empresaId, usuarioId);
      return res.status(200).json({
        sucesso: true,
        pagamentos: pagamentos,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async listarVencidos(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamentos = await pagamentoService.listarPagamentosVencidos(usuarioId);
      return res.status(200).json({
        sucesso: true,
        pagamentos: pagamentos,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async marcarComoPago(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamento = await pagamentoService.marcarComoPago(id, usuarioId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Pagamento marcado como pago",
        pagamento: pagamento,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = atualizarPagamentoSchema.safeParse(req.body);
      
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }

      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamento = await pagamentoService.atualizarPagamento(id, data.data, usuarioId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Pagamento atualizado com sucesso",
        pagamento: pagamento,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async obterEstatisticas(req: Request, res: Response): Promise<Response> {
    try {
      const { empresaId } = req.params;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const estatisticas = await pagamentoService.obterEstatisticasPagamentos(empresaId, usuarioId);
      return res.status(200).json({
        sucesso: true,
        estatisticas: estatisticas,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async meusPagamentos(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const pagamentos = await pagamentoService.listarPagamentosPorUsuario(usuarioId, usuarioId);
      return res.status(200).json({
        sucesso: true,
        pagamentos: pagamentos,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }
}