import { Request, Response } from "express";
import { NotificacaoService } from "../../service/Notificacao/NotificacaoService";
import { criarNotificacaoSchema, filtroNotificacoesSchema, marcarComoLidaSchema, enviarPredefinidasSchema } from "../../schema/Notificacao.schema";
import { TipoNotificacao } from "../../generated/prisma";

const notificacaoService = new NotificacaoService();

export class NotificacaoController {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarNotificacaoSchema.safeParse(req.body);
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

      const notificacao = await notificacaoService.criarNotificacao({
        ...data.data,
        tipo: data.data.tipo as TipoNotificacao
      }, usuarioId);
      return res.status(201).json({
        sucesso: true,
        mensagem: "Notificação criada com sucesso",
        notificacao: notificacao,
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
      const { limite } = req.query;
      const usuarioSolicitante = req.user?.id;
      
      if (!usuarioSolicitante) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const limiteNum = limite ? parseInt(limite as string) : undefined;
      const notificacoes = await notificacaoService.listarNotificacoesPorUsuario(
        usuarioId, 
        usuarioSolicitante, 
        limiteNum
      );
      
      return res.status(200).json({
        sucesso: true,
        notificacoes: notificacoes,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async listarNaoLidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const notificacoes = await notificacaoService.listarNotificacoesNaoLidas(usuarioId);
      return res.status(200).json({
        sucesso: true,
        notificacoes: notificacoes,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async marcarComoLida(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const notificacao = await notificacaoService.marcarComoLida(id, usuarioId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Notificação marcada como lida",
        notificacao: notificacao,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async marcarTodasComoLidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const quantidade = await notificacaoService.marcarTodasComoLidas(usuarioId);
      return res.status(200).json({
        sucesso: true,
        mensagem: `${quantidade} notificações marcadas como lidas`,
        quantidade: quantidade,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async contarNaoLidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const quantidade = await notificacaoService.contarNotificacoesNaoLidas(usuarioId);
      return res.status(200).json({
        sucesso: true,
        quantidade: quantidade,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async processarInadimplencia(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const resultado = await notificacaoService.processarNotificacoesInadimplencia();
      return res.status(200).json({
        sucesso: true,
        mensagem: "Processamento de inadimplência concluído",
        resultado: resultado,
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

      const filtro = req.query.filtro ? JSON.parse(req.query.filtro as string) : undefined;
      const notificacoes = await notificacaoService.listarNotificacoesPorEmpresa(
        empresaId, 
        usuarioId, 
        filtro
      );
      
      return res.status(200).json({
        sucesso: true,
        notificacoes: notificacoes,
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

      const estatisticas = await notificacaoService.obterEstatisticasNotificacoes(empresaId, usuarioId);
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

  async enviarSistemaPredefinidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const parsed = enviarPredefinidasSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: parsed.error.errors
        });
      }

      const resultado = await notificacaoService.enviarSistemaPredefinidas(
        usuarioId,
        parsed.data.tipo as TipoNotificacao,
        parsed.data.mensagem,
        parsed.data.inquilinoId
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Notificações do sistema enviadas com sucesso",
        resultado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async enviarEmailPredefinidas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const parsed = enviarPredefinidasSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: parsed.error.errors
        });
      }

      const resultado = await notificacaoService.enviarEmailPredefinidas(
        usuarioId,
        parsed.data.tipo as TipoNotificacao,
        parsed.data.mensagem,
        parsed.data.assunto,
        parsed.data.inquilinoId
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: "Emails enviados com sucesso",
        resultado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }
}