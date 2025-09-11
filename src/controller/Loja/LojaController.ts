import { Request, Response } from "express";
import { LojaService } from "../../service/Loja/LojaService";
import { criarLojaSchema, vincularInquilinoSchema, atualizarStatusLojaSchema, editarLojaSchema, listarLojasSchema, buscarLojaPorIdSchema, desativarLojaSchema } from "../../schema/Loja.schema";

const lojaService = new LojaService();

export class LojaController {


  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarLojaSchema.safeParse(req.body);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }

      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const dadosLoja = {
        ...data.data,
        empresaId: empresaId
      };

      const loja = await lojaService.criarLoja(dadosLoja, usuarioId);
      return res.status(201).json({
        sucesso: true,
        mensagem: "Loja criada com sucesso",
        loja: loja,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

async listarLojas(req: Request, res: Response): Promise<Response> {
  try {
    const data = listarLojasSchema.safeParse(req.query);
    if (!data.success) {
      return res.status(400).json({ 
        error: "Parâmetros inválidos",
        details: data.error.errors 
      });
    }

    // Pegar empresaId e usuarioId do token JWT
    const usuarioId = req.user?.id;
    const empresaId = req.user?.empresaId;
    
    if (!usuarioId || !empresaId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const { nome, status, numero, localizacao, page, limit } = data.data;
    const filtros = { nome, status, numero, localizacao };
    
    const resultado = await lojaService.listarLojas(empresaId, usuarioId, filtros, page, limit);
    
    return res.status(200).json({
      sucesso: true,
      lojas: resultado.lojas,
      paginacao: {
        paginaAtual: page,
        limitePorPagina: limit,
        totalLojas: resultado.totalLojas,
        totalPaginas: resultado.totalPaginas
      }
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Erro interno do servidor",
    });
  }
}
  async listarLojasDaEmpresa(req: Request, res: Response): Promise<Response> {
    try {
      const { page = '1', limit = '10' } = req.query;
      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Validação dos parâmetros de paginação
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ error: "Página deve ser um número maior que 0" });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({ error: "Limite deve ser um número entre 1 e 100" });
      }

      const resultado = await lojaService.listarLojasDaEmpresa(empresaId, usuarioId, pageNumber, limitNumber);
      
      // Verificar se o resultado tem paginação
      if (Array.isArray(resultado)) {
        // Caso sem paginação (não deveria acontecer aqui, mas por segurança)
        return res.status(200).json({
          sucesso: true,
          lojas: resultado
        });
      } else {
        // Caso com paginação
        return res.status(200).json({
          sucesso: true,
          lojas: resultado.lojas,
          paginacao: {
            paginaAtual: pageNumber,
            limitePorPagina: limitNumber,
            totalLojas: resultado.totalLojas,
            totalPaginas: resultado.totalPaginas
          }
        });
      }
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<Response> {
    try {
      const data = buscarLojaPorIdSchema.safeParse(req.params);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: data.error.errors 
        });
      }

      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = data.data;
      const loja = await lojaService.buscarLojaPorId(id, usuarioId, empresaId);
      return res.status(200).json({
        sucesso: true,
        loja: loja,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async editarLoja(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = editarLojaSchema.safeParse(req.body);
      
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }

      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const loja = await lojaService.editarLoja(id, data.data, usuarioId, empresaId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Loja editada com sucesso",
        loja: loja,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async desvincularInquilino(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const loja = await lojaService.desvincularInquilino(id, usuarioId, empresaId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Inquilino desvinculado com sucesso",
        loja: loja,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async desativarLoja(req: Request, res: Response): Promise<Response> {
    try {
      const data = desativarLojaSchema.safeParse(req.params);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Parâmetros inválidos",
          details: data.error.errors 
        });
      }

      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = data.data;
      await lojaService.desativarLoja(id, usuarioId, empresaId);
      
      return res.status(200).json({
        sucesso: true,
        mensagem: "Loja desativada com sucesso"
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }
}