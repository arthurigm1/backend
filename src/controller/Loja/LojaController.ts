import { Request, Response } from "express";
import { LojaService } from "../../service/Loja/LojaService";
import { criarLojaSchema, vincularInquilinoSchema, atualizarStatusLojaSchema } from "../../schema/Loja.schema";

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
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const loja = await lojaService.criarLoja(data.data, usuarioId);
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

  async listarLojasDaEmpresa(req: Request, res: Response): Promise<Response> {
    try {
      const { empresaId } = req.params;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const lojas = await lojaService.listarLojasDaEmpresa(empresaId, usuarioId);
      return res.status(200).json({
        sucesso: true,
        lojas: lojas,
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

      const loja = await lojaService.buscarLojaPorId(id, usuarioId);
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

  async vincularInquilino(req: Request, res: Response): Promise<Response> {
    try {
      const data = vincularInquilinoSchema.safeParse(req.body);
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

      const contrato = await lojaService.vincularInquilino(data.data, usuarioId);
      return res.status(201).json({
        sucesso: true,
        mensagem: "Inquilino vinculado à loja com sucesso",
        contrato: contrato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async atualizarStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const data = atualizarStatusLojaSchema.safeParse(req.body);
      
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

      const loja = await lojaService.atualizarStatusLoja(id, data.data.status, usuarioId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Status da loja atualizado com sucesso",
        loja: loja,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }
}