import { Request, Response } from "express";
import { EmpresaService } from "../../service/Empresa/EmpresaService";
import { criarEmpresaSchema } from "../../schema/Empresa.schema";


const empresaService = new EmpresaService();

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
}