import { Request, Response } from "express";
import { ContratoService } from "../../service/Contrato/ContratoService";
import { StatusContrato } from "../../generated/prisma";
import { 
  criarContratoSchema, 
  atualizarContratoSchema, 
  rescindirContratoSchema, 
  renovarContratoSchema,
  contratoIdSchema,
  buscarContratosVencendoSchema,
  filtrosContratoSchema
} from "../../schema/Contrato.schema";

const contratoService = new ContratoService();

export class ContratoController {
  async criarContrato(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarContratoSchema.safeParse(req.body);
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

      const dadosContrato = data.data;

      const contrato = await contratoService.criarContrato(dadosContrato, usuarioId);
      
      return res.status(201).json({
        sucesso: true,
        mensagem: "Contrato criado com sucesso",
        contrato: contrato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async listarContratosDaEmpresa(req: Request, res: Response): Promise<Response> {
    try {
      const queryValidation = filtrosContratoSchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: queryValidation.error.errors 
        });
      }

      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const filtros = {
        ...queryValidation.data,
        page: queryValidation.data.page || 1,
        limit: queryValidation.data.limit || 10
      };

      const pageNumber = filtros.page;
      const limitNumber = filtros.limit;

      const resultado = await contratoService.listarContratosDaEmpresa(
        empresaId, 
        usuarioId, 
        filtros,
        pageNumber, 
        limitNumber
      );

      // Verificar se o resultado é um array (sem paginação) ou objeto (com paginação)
      if (Array.isArray(resultado)) {
        return res.status(200).json({
          sucesso: true,
          contratos: resultado,
        });
      } else {
        return res.status(200).json({
          sucesso: true,
          contratos: resultado.contratos,
          paginaAtual: pageNumber,
          limitePorPagina: limitNumber,
          totalContratos: resultado.totalContratos,
          totalPaginas: resultado.totalPaginas,
        });
      }
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async buscarContratoPorId(req: Request, res: Response): Promise<Response> {
    try {
      const paramValidation = contratoIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: paramValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const contrato = await contratoService.buscarContratoPorId(id, usuarioId);
      
      return res.status(200).json({
        sucesso: true,
        contrato: contrato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async atualizarContrato(req: Request, res: Response): Promise<Response> {
    try {
      const paramValidation = contratoIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: paramValidation.error.errors 
        });
      }

      const bodyValidation = atualizarContratoSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: bodyValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const dadosAtualizacao = bodyValidation.data;

      const contrato = await contratoService.atualizarContrato(id, dadosAtualizacao, usuarioId);
      
      return res.status(200).json({
        sucesso: true,
        mensagem: "Contrato atualizado com sucesso",
        contrato: contrato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async deletarContrato(req: Request, res: Response): Promise<Response> {
    try {
      const paramValidation = contratoIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: paramValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const resultado = await contratoService.deletarContrato(id, usuarioId);
      
      return res.status(200).json({
        sucesso: true,
        mensagem: resultado.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async rescindirContrato(req: Request, res: Response): Promise<Response> {
    try {
      const paramValidation = contratoIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: paramValidation.error.errors 
        });
      }

      const bodyValidation = rescindirContratoSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: bodyValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const { observacoes } = bodyValidation.data;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const contrato = await contratoService.rescindirContrato(id, usuarioId, observacoes);
      
      return res.status(200).json({
        sucesso: true,
        mensagem: "Contrato rescindido com sucesso",
        contrato: contrato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async renovarContrato(req: Request, res: Response): Promise<Response> {
    try {
      const paramValidation = contratoIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: paramValidation.error.errors 
        });
      }

      const bodyValidation = renovarContratoSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: bodyValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const { novaDataFim, novoValor } = bodyValidation.data;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const dataFim = new Date(novaDataFim);
      const valor = novoValor ? novoValor : undefined;

      const contrato = await contratoService.renovarContrato(id, dataFim, usuarioId, valor);
      
      return res.status(200).json({
        sucesso: true,
        mensagem: "Contrato renovado com sucesso",
        contrato: contrato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async buscarContratosVencendoEm(req: Request, res: Response): Promise<Response> {
    try {
      const queryValidation = buscarContratosVencendoSchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: queryValidation.error.errors 
        });
      }

      const { dias } = queryValidation.data;

      const contratos = await contratoService.buscarContratosVencendoEm(dias);
      
      return res.status(200).json({
        sucesso: true,
        contratos: contratos,
        diasParaVencimento: dias,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async buscarContratosVencidos(req: Request, res: Response): Promise<Response> {
    try {
      const contratos = await contratoService.buscarContratosVencidos();
      
      return res.status(200).json({
        sucesso: true,
        contratos: contratos,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async atualizarStatusContratosVencidos(req: Request, res: Response): Promise<Response> {
    try {
      const contratosAtualizados = await contratoService.atualizarStatusContratosVencidos();
      
      return res.status(200).json({
        sucesso: true,
        mensagem: `${contratosAtualizados} contratos foram marcados como vencidos`,
        contratosAtualizados: contratosAtualizados,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }
}