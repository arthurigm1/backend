import { Request, Response } from "express";
import {
  criarUsuarioComEmpresaSchema,
  criarUsuarioSchema,
  criarInquilinoSchema,
  loginUsuarioSchema,
  solicitarRedefinicaoSenhaSchema,
  redefinirSenhaSchema,
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
        mensagem: "Usuário criado com sucesso",
        usuario: resultado.usuario.email,
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

  async loginInquilino(req: Request, res: Response): Promise<Response> {
    try {
      const loginusuario = loginUsuarioSchema.safeParse(req.body);
      if (!loginusuario.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: loginusuario.error.errors 
        });
      }
      
      const resultado = await usuarioService.loginInquilino(loginusuario.data);
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
      
      // Parâmetros de paginação
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      // Filtros de busca
      const q = (req.query.q as string) || undefined;
      const nome = (req.query.nome as string) || undefined;
      const email = (req.query.email as string) || undefined;
      
      // Validar parâmetros
      if (page < 1) {
        return res.status(400).json({ error: "Página deve ser maior que 0" });
      }
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ error: "Limite deve estar entre 1 e 100" });
      }
      
      const resultado = await usuarioService.listarUsuariosDaEmpresa(
        usuarioLogadoId,
        page,
        limit,
        { q, nome, email }
      );
      return res.status(200).json({
        sucesso: true,
        usuarios: resultado.usuarios,
        paginacao: {
          paginaAtual: page,
          totalPaginas: resultado.totalPaginas,
          totalUsuarios: resultado.totalUsuarios,
          limite: limit,
          temProximaPagina: page < resultado.totalPaginas,
          temPaginaAnterior: page > 1
        }
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


  async solicitarRedefinicaoSenha(req: Request, res: Response): Promise<Response> {
    try {
      const dadosValidados = solicitarRedefinicaoSenhaSchema.safeParse(req.body);
      if (!dadosValidados.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: dadosValidados.error.errors 
        });
      }
      
      const resultado = await usuarioService.solicitarRedefinicaoSenha(dadosValidados.data);
      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ 
        error: error.message || "Erro interno do servidor" 
      });
    }
  }

  async redefinirSenha(req: Request, res: Response): Promise<Response> {
    try {
      const dadosValidados = redefinirSenhaSchema.safeParse(req.body);
      if (!dadosValidados.success) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: dadosValidados.error.errors 
        });
      }
      
      const resultado = await usuarioService.redefinirSenha(dadosValidados.data);
      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ 
        error: error.message || "Erro ao redefinir senha" 
      });
    }
  }

  async listarInquilinos(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.user?.id;
      const empresaId = req.user?.empresaId;
      
      if (!usuarioId || !empresaId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const inquilinos = await usuarioService.listarInquilinos(empresaId, usuarioId);
      return res.status(200).json({
        sucesso: true,
        inquilinos: inquilinos,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async desativarUsuario(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioLogadoId = req.user?.id;
      const { id } = req.params;

      if (!usuarioLogadoId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!id) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }

      const usuario = await usuarioService.desativarUsuario(id, usuarioLogadoId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Usuário desativado com sucesso",
        usuario,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }

  async ativarUsuario(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioLogadoId = req.user?.id;
      const { id } = req.params;

      if (!usuarioLogadoId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!id) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }

      const usuario = await usuarioService.ativarUsuario(id, usuarioLogadoId);
      return res.status(200).json({
        sucesso: true,
        mensagem: "Usuário ativado com sucesso",
        usuario,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "Erro interno do servidor",
      });
    }
  }
}
