import { ICriarUsuario, ICriarInquilino, ILoginUsuario, ICriarUsuarioComEmpresa, ISolicitarRedefinicaoSenha, IRedefinirSenha } from "../../interface/Usuario/Usuario";
import { PrismaClient, TipoUsuario } from "../../generated/prisma";
import * as bcrypt from "bcrypt";

const prismaClient = new PrismaClient();

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

  async desativarUsuario(usuarioId: string) {
    return await prismaClient.usuario.update({
      where: { id: usuarioId },
      data: {
        ativo: false,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        empresaId: true,
      }
    });
  }
  async ativarUsuario(usuarioId: string) {
    return await prismaClient.usuario.update({
      where: { id: usuarioId },
      data: { ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        empresaId: true,
      }
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
      ativo: true,
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

  async listarUsuariosDaEmpresa(
    empresaId: string,
    page: number = 1,
    limit: number = 10,
    filtros?: { q?: string; nome?: string; email?: string; tipo?: string; ativo?: boolean }
  ) {
    const skip = (page - 1) * limit;

    const where: any = { empresaId };
    const andConditions: any[] = [];

    const q = filtros?.q?.trim();
    const nome = filtros?.nome?.trim();
    const email = filtros?.email?.trim();
    const tipo = filtros?.tipo?.trim();
    const ativo = filtros?.ativo;

    if (q && q.length > 0) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (nome && nome.length > 0) {
      andConditions.push({ nome: { contains: nome, mode: 'insensitive' } });
    }

    if (email && email.length > 0) {
      andConditions.push({ email: { contains: email, mode: 'insensitive' } });
    }

    if (tipo && tipo.length > 0) {
      where.tipo = tipo.toUpperCase();
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (typeof ativo === 'boolean') {
      where.ativo = ativo;
    }

    // Buscar usuários com paginação
    const usuarios = await prismaClient.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        tipo: true,
        ativo: true,
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
      where,
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
        status: 'ATIVO',
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
