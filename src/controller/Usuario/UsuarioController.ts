import { Request, Response } from "express";
import {
  criarUsuarioComEmpresaSchema,
  criarUsuarioSchema,
  criarInquilinoSchema,
  loginUsuarioSchema,
} from "../../schema/Usuario.schema";
import { UsuarioService } from "../../service/Usuario/UsuarioService";
import { MENSAGEM_SUCESSO_USER_CRIADO } from "../../constants/sucesso";

const usuarioService = new UsuarioService();

export class UsuarioController {
  
  async createWithCompany(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarUsuarioComEmpresaSchema.safeParse(req.body);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }
      
      const resultado = await usuarioService.criarUsuarioComEmpresa(data.data);
      return res.status(201).json({
        sucesso: true,
        mensagem: "Usuário e empresa criados com sucesso",
        usuario: resultado.usuario,
        empresa: resultado.empresa,
        token: resultado.token,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarUsuarioSchema.safeParse(req.body);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }
      
      const usuarioLogadoId = req.user?.id;
      if (!usuarioLogadoId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const resultado = await usuarioService.criarUsuario(data.data, usuarioLogadoId);
      return res.status(201).json({
        sucesso: true,
        mensagem: MENSAGEM_SUCESSO_USER_CRIADO,
        usuario: resultado.usuario,
        token: resultado.token,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async createTenant(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarInquilinoSchema.safeParse(req.body);
      if (!data.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: data.error.errors 
        });
      }
      
      const usuarioLogadoId = req.user?.id;
      if (!usuarioLogadoId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const resultado = await usuarioService.criarInquilino(data.data, usuarioLogadoId);
      return res.status(201).json({
        sucesso: true,
        mensagem: "Inquilino criado com sucesso",
        inquilino: resultado.inquilino,
        token: resultado.token,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const loginusuario = loginUsuarioSchema.safeParse(req.body);
      if (!loginusuario.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: loginusuario.error.errors 
        });
      }
      
      const resultado = await usuarioService.login(loginusuario.data);
      return res.status(200).json({
        sucesso: true,
        usuario: resultado.usuario,
        token: resultado.token,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 401).json({ 
        error: error.message || "Usuário ou senha inválidos" 
      });
    }
  }

  async listarUsuariosDaEmpresa(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioLogadoId = req.user?.id;
      if (!usuarioLogadoId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const usuarios = await usuarioService.listarUsuariosDaEmpresa(usuarioLogadoId);
      return res.status(200).json({
        sucesso: true,
        usuarios: usuarios,
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
      const usuarioLogadoId = req.user?.id;
      
      if (!usuarioLogadoId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }
      
      const usuario = await usuarioService.buscarUsuarioPorId(id, usuarioLogadoId);
      return res.status(200).json({
        sucesso: true,
        usuario: usuario,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async teste(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json({
        sucesso: true,
        mensagem: "Teste OK",
        usuario: req.user,
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
