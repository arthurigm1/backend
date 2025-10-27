import { Request, Response } from "express";
import { EmpresaService } from "../../service/Empresa/EmpresaService";
import { criarEmpresaSchema } from "../../schema/Empresa.schema";
import { AnalyticsService } from "../../service/Empresa/AnalyticsService";


const empresaService = new EmpresaService();
const analyticsService = new AnalyticsService();

export class EmpresaController {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarEmpresaSchema.safeParse(req.body);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }
      
      const empresa = await empresaService.criarEmpresa(data.data);
      return res.status(201).json({
        sucesso: true,
        mensagem: "Empresa criada com sucesso",
        empresa: empresa,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async buscarPorCnpj(req: Request, res: Response): Promise<Response> {
    try {
      const { cnpj } = req.params;
      
      if (!cnpj) {
        return res.status(400).json({ error: "CNPJ é obrigatório" });
      }
      
      const empresa = await empresaService.buscarEmpresaPorCnpj(cnpj);
      return res.status(200).json({
        sucesso: true,
        empresa: empresa,
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
      
      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }
      
      const empresa = await empresaService.buscarEmpresaPorId(id);
      return res.status(200).json({
        sucesso: true,
        empresa: empresa,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async listar(req: Request, res: Response): Promise<Response> {
    try {
      const empresas = await empresaService.listarEmpresas();
      return res.status(200).json({
        sucesso: true,
        empresas: empresas,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async listarInadimplentes(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(400).json({ error: "Usuário sem empresa associada" });
      }

      const { lojaId, inquilinoId, q, page, limit } = req.query;

      const filtros = {
        lojaId: lojaId as string,
        inquilinoId: inquilinoId as string,
        q: q as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const resultado = await empresaService.buscarInquilinosInadimplentes(empresaId, filtros);
      
      return res.status(200).json({
        sucesso: true,
        ...resultado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async obterAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(400).json({ error: "Usuário sem empresa associada" });
      }

      // Filtros de período (opcionais)
      const { inicio, fim } = req.query;
      let inicioDate: Date | undefined;
      let fimDate: Date | undefined;

      if (typeof inicio === 'string' && inicio.trim()) {
        const d = new Date(inicio);
        if (!isNaN(d.getTime())) inicioDate = d;
      }
      if (typeof fim === 'string' && fim.trim()) {
        const d = new Date(fim);
        if (!isNaN(d.getTime())) fimDate = d;
      }

      const dados = await analyticsService.gerarAnalyticsEmpresa(empresaId, { inicio: inicioDate, fim: fimDate });
      return res.status(200).json({ sucesso: true, analytics: dados });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }
}