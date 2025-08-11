import { ICriarUsuario, ICriarUsuarioComEmpresa, ICriarInquilino, ILoginUsuario } from "../../interface/Usuario/Usuario";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { EmpresaService } from "../Empresa/EmpresaService";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../../utils/jwt";
import { ApiError } from "../../utils/apiError";

const usuarioModel = new UsuarioModel();
const empresaService = new EmpresaService();

export class UsuarioService {
  async criarUsuarioComEmpresa(data: ICriarUsuarioComEmpresa) {
    // Primeiro cria a empresa
    const empresa = await empresaService.criarEmpresa(data.empresa);
    
    // Depois cria o usuário admin da empresa
    const usuarioData: ICriarUsuario = {
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      cpf: data.cpf,
      telefone: data.telefone,
      empresaId: empresa.id,
      tipo: 'ADMIN_EMPRESA'
    };
    
    const usuario = await usuarioModel.criarUsuario(usuarioData);
    const token = generateAccessToken({
      id: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      tipo: usuario.tipo,
    });
    
    return { usuario, empresa, token };
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

  async listarUsuariosDaEmpresa(usuarioLogadoId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    return await usuarioModel.listarUsuariosDaEmpresa(usuarioLogado.empresaId);
  }

  async buscarUsuarioPorId(id: string, usuarioLogadoId: string) {
    const usuarioLogado = await usuarioModel.buscarPorId(usuarioLogadoId);
    if (!usuarioLogado) {
      throw new ApiError(404, "Usuário logado não encontrado");
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
}
