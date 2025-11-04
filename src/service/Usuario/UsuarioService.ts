import { ICriarUsuario, ICriarUsuarioComEmpresa, ICriarInquilino, ILoginUsuario, ISolicitarRedefinicaoSenha, IRedefinirSenha } from "../../interface/Usuario/Usuario";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { EmpresaService } from "../Empresa/EmpresaService";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../../utils/jwt";
import { ApiError } from "../../utils/apiError";
import { emailService } from "../Email/EmailService";
import crypto from "crypto";
import { TipoUsuario } from "../../generated/prisma";

const usuarioModel = new UsuarioModel();
const empresaService = new EmpresaService();

export class UsuarioService {
  async criarUsuarioComEmpresa(data: ICriarUsuarioComEmpresa) {
    // Verificar se a empresa existe
    const empresa = await empresaService.buscarEmpresaPorId(data.empresaId);
    if (!empresa) {
      throw new ApiError(404, "Empresa não encontrada");
    }
    
    // Criar o usuário para a empresa especificada
    const usuarioData: ICriarUsuarioComEmpresa = {
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      empresaId: data.empresaId,
    };
    
    const usuario = await usuarioModel.criarUsuario(usuarioData);
    const token = generateAccessToken({
      id: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      tipo: "ADMIN_EMPRESA"
    });
    
    return { usuario, empresa, token };
  }

  async desativarUsuario(usuarioId: string, usuarioLogadoId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário logado não encontrado");
    }

    // Apenas ADMIN_EMPRESA pode desativar
    if (usuarioLogado.tipo !== "ADMIN_EMPRESA") {
      throw new ApiError(403, "Apenas administradores da empresa podem desativar usuários");
    }

    const usuarioAlvo = await usuarioModel.buscarPorId(usuarioId);
    if (!usuarioAlvo) {
      throw new ApiError(404, "Usuário alvo não encontrado");
    }

    // Verificar se pertence à mesma empresa
    if (usuarioAlvo.empresaId !== usuarioLogado.empresaId) {
      throw new ApiError(403, "Você só pode desativar usuários da sua empresa");
    }

    const usuarioAtualizado = await usuarioModel.desativarUsuario(usuarioId);
    return usuarioAtualizado;
  }

  async ativarUsuario(usuarioId: string, usuarioLogadoId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário logado não encontrado");
    }

    // Apenas ADMIN_EMPRESA pode ativar
    if (usuarioLogado.tipo !== "ADMIN_EMPRESA") {
      throw new ApiError(403, "Apenas administradores da empresa podem ativar usuários");
    }

    const usuarioAlvo = await usuarioModel.buscarPorId(usuarioId);
    if (!usuarioAlvo) {
      throw new ApiError(404, "Usuário alvo não encontrado");
    }

    // Verificar se pertence à mesma empresa
    if (usuarioAlvo.empresaId !== usuarioLogado.empresaId) {
      throw new ApiError(403, "Você só pode ativar usuários da sua empresa");
    }

    const usuarioAtualizado = await usuarioModel.ativarUsuario(usuarioId);
    return usuarioAtualizado;
  }

  async criarUsuario(data: ICriarUsuario, usuarioLogadoId: string) {
    // Verificar se o usuário logado pertence à mesma empresa
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário logado não encontrado");
    }

    // Verificar se o usuário logado tem permissão para criar usuários
    if (usuarioLogado.tipo !== 'ADMIN_EMPRESA') {
      throw new ApiError(403, "Apenas administradores da empresa podem criar usuários");
    }

    // Verificar se está tentando criar usuário para a mesma empresa
    if (data.empresaId !== usuarioLogado.empresaId) {
      throw new ApiError(403, "Você só pode criar usuários para sua própria empresa");
    }

    const usuario = await usuarioModel.criarUsuario(data);
    const token = generateAccessToken({
      id: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      tipo: usuario.tipo,
    });
    
    return { usuario, token };
  }

  async criarInquilino(data: ICriarInquilino, usuarioLogadoId: string) {
    // Verificar se o usuário logado existe e pertence a uma empresa
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário logado não encontrado");
    }

    // Verificar se o usuário logado tem permissão para criar inquilinos
    if (usuarioLogado.tipo === 'INQUILINO') {
      throw new ApiError(403, "Inquilinos não podem criar outros usuários");
    }
        if (usuarioLogado.tipo === 'VISITANTE') {
      throw new ApiError(403, "Visitante não podem criar outros usuários");
    }


    const inquilino = await usuarioModel.criarInquilino(data, usuarioLogado.empresaId);
    const token = generateAccessToken({
      id: inquilino.id,
      email: inquilino.email,
      empresaId: inquilino.empresaId,
      tipo: inquilino.tipo,
    });
    
    return { inquilino, token };
  }

  async login(data: ILoginUsuario) {
    const usuario = await usuarioModel.login(data.email);

    if (!usuario) {
      throw new ApiError(401, "Usuário ou senha inválidos");
    }

    if (usuario.ativo === false) {
      throw new ApiError(403, "Usuário desativado. Contate o administrador.");
    }
    
    const senhaValida = await bcrypt.compare(data.senha, usuario.senha);
    if (!senhaValida) {
      throw new ApiError(401, "Usuário ou senha inválidos");
    }

    if (usuario.tipo === TipoUsuario.INQUILINO ) {
      throw new ApiError(401, "Usuário tipo inquilino não acessa esta rota!!");
    }
    
    const token = generateAccessToken({
      id: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      tipo: usuario.tipo,
    });
    
    const { senha, ...usuarioSemSenha } = usuario;
    return { usuario: usuarioSemSenha, token };
  }

  async loginInquilino(data: ILoginUsuario) {
    const usuario = await usuarioModel.login(data.email);

    if (!usuario) {
      throw new ApiError(401, "Usuário ou senha inválidos");
    }

    if (usuario.ativo === false) {
      throw new ApiError(403, "Usuário desativado. Contate o administrador.");
    }
    
    // Verificar se o usuário é do tipo INQUILINO
    if (usuario.tipo !== 'INQUILINO') {
      throw new ApiError(403, "Acesso negado. Apenas inquilinos podem fazer login por esta rota");
    }
    
    const senhaValida = await bcrypt.compare(data.senha, usuario.senha);
    if (!senhaValida) {
      throw new ApiError(401, "Usuário ou senha inválidos");
    }
    
    const token = generateAccessToken({
      id: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      tipo: usuario.tipo,
    });
    
    const { senha, ...usuarioSemSenha } = usuario;
    return { usuario: usuarioSemSenha, token };
  }

  async listarUsuariosDaEmpresa(
    usuarioLogadoId: string,
    page: number = 1,
    limit: number = 10,
    filtros?: { q?: string; nome?: string; email?: string }
  ) {
    
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário não encontrado");
    }
     if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }

    const resultado = await usuarioModel.listarUsuariosDaEmpresa(
      usuarioLogado.empresaId,
      page,
      limit,
      filtros
    );
    return resultado;
  }

  async buscarUsuarioPorId(id: string, usuarioLogadoId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário logado não encontrado");
    }
        if (usuarioLogado?.tipo === "VISITANTE" || usuarioLogado?.tipo === "INQUILINO") {
      throw new ApiError(403, "Voce não tem permissao para visualizar lojas");
    }
    const usuario = await usuarioModel.buscarPorId(id);
    if (!usuario) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    // Verificar se o usuário pertence à mesma empresa
    if (usuario.empresaId !== usuarioLogado.empresaId) {
      throw new ApiError(403, "Você só pode visualizar usuários da sua empresa");
    }

    return usuario;
  }

  async solicitarRedefinicaoSenha(data: ISolicitarRedefinicaoSenha) {
    const usuario = await usuarioModel.buscarPorEmail(data.email);
    
    if (!usuario) {
      // Por segurança, não revelamos se o email existe ou não
      return { sucesso: true, mensagem: "Se o email existir, você receberá instruções para redefinir sua senha." };
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token expira em 1 hora
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    // Salvar token no banco
    await usuarioModel.salvarTokenRedefinicaoSenha(usuario.id, resetToken, expires);

    // Enviar email
    await emailService.enviarEmailRedefinicaoSenha(usuario.email, usuario.nome, resetToken);

    return { 
      sucesso: true, 
      mensagem: "Se o email existir, você receberá instruções para redefinir sua senha." 
    };
  }

  async redefinirSenha(data: IRedefinirSenha) {
    const usuario = await usuarioModel.buscarPorTokenRedefinicao(data.token);
    
    if (!usuario) {
      throw new ApiError(400, "Token inválido ou expirado");
    }

    // Validar força da senha
    if (data.novaSenha.length < 6) {
      throw new ApiError(400, "A senha deve ter pelo menos 6 caracteres");
    }

    // Atualizar senha e limpar token
    const usuarioAtualizado = await usuarioModel.atualizarSenha(usuario.id, data.novaSenha);

    // Enviar email de confirmação
    await emailService.enviarEmailConfirmacaoRedefinicao(usuarioAtualizado.email, usuarioAtualizado.nome);

    return { 
      sucesso: true, 
      mensagem: "Senha redefinida com sucesso" 
    };
  }

  async listarInquilinos(empresaId: string, usuarioLogadoId: string) {
    // Verificar se o usuário logado existe e pertence à empresa
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    if (usuarioLogado.empresaId !== empresaId) {
      throw new ApiError(403, "Você não tem permissão para listar inquilinos desta empresa");
    }

    // Listar apenas inquilinos da empresa
    const inquilinos = await usuarioModel.listarInquilinosDaEmpresa(empresaId);
    return inquilinos;
  }
}
