import { ICriarUsuario, ICriarInquilino, ILoginUsuario, ICriarUsuarioComEmpresa, ISolicitarRedefinicaoSenha, IRedefinirSenha } from "../../interface/Usuario/Usuario";
import { PrismaClient, TipoUsuario } from "../../generated/prisma";

const prismaClient = new PrismaClient();
import bcrypt from "bcrypt";

export class UsuarioModel {
  async criarUsuario(usuario: ICriarUsuarioComEmpresa) {
    return await prismaClient.usuario.create({
      data: {
        nome: usuario.nome,
        email: usuario.email,
        senha: await bcrypt.hash(usuario.senha, 10),
        cpf: usuario.cpf,
        tipo: "VISITANTE",
        empresaId: usuario.empresaId,
      },
    });
  }

  async criarInquilino(inquilino: ICriarInquilino, empresaId: string) {
    return await prismaClient.usuario.create({
      data: {
        nome: inquilino.nome,
        email: inquilino.email,
        senha: await bcrypt.hash(inquilino.senha, 10),
        cpf: inquilino.cpf,
        telefone: inquilino.telefone,
        tipo: "INQUILINO",
        empresaId: empresaId,
      },
    });
  }

async login(email: string) {
  const user = await prismaClient.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      senha: true,
      tipo: true,
      empresaId: true,
      empresa: { select: { id: true, nome: true, cnpj: true } },
    },
  });
  

  return user;
}


  async buscarPorId(id: string) {
    return await prismaClient.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        tipo: true,
        empresaId: true,
        empresa: {
          select: {
            nome: true,
            cnpj: true,
          },
        },
      },
    });
  }

  async listarUsuariosDaEmpresa(empresaId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Buscar usuários com paginação
    const usuarios = await prismaClient.usuario.findMany({
      where: { empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        tipo: true,
        criadoEm: true,
      },
      skip: skip,
      take: limit,
      orderBy: {
        criadoEm: 'desc',
      },
    });
    
    // Contar total de usuários
    const totalUsuarios = await prismaClient.usuario.count({
      where: { empresaId },
    });
    
    const totalPaginas = Math.ceil(totalUsuarios / limit);
    
    return {
      usuarios,
      totalUsuarios,
      totalPaginas,
    };
  }

  async verificarSeUsuarioPertenceEmpresa(usuarioId: string, empresaId: string) {
    const usuario = await prismaClient.usuario.findFirst({
      where: {
        id: usuarioId,
        empresaId: empresaId,
      },
    });
    return !!usuario;
  }

  async buscarContratoAtivoInquilino(inquilinoId: string) {
    return await prismaClient.contrato.findFirst({
      where: {
        inquilinoId: inquilinoId,
        ativo: true,
      },
    });
  }

  async buscarPorEmail(email: string) {
    return await prismaClient.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        empresaId: true,
      },
    });
  }

  async salvarTokenRedefinicaoSenha(usuarioId: string, token: string, expires: Date) {
    return await prismaClient.usuario.update({
      where: { id: usuarioId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
  }

  async buscarPorTokenRedefinicao(token: string) {
    return await prismaClient.usuario.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        resetPasswordToken: true,
        resetPasswordExpires: true,
      },
    });
  }

  async atualizarSenha(usuarioId: string, novaSenha: string) {
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    
    return await prismaClient.usuario.update({
      where: { id: usuarioId },
      data: {
        senha: senhaHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });
  }

  async listarInquilinosDaEmpresa(empresaId: string) {
    return await prismaClient.usuario.findMany({
      where: {
        empresaId: empresaId,
        tipo: 'INQUILINO',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }
}
