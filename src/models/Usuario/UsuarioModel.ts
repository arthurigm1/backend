import { ICriarUsuario, ICriarInquilino, ILoginUsuario } from "../../interface/Usuario/Usuario";
import prismaClient from "../../prisma/PrismaClient";
import bcrypt from "bcrypt";

export class UsuarioModel {
  async criarUsuario(usuario: ICriarUsuario) {
    return await prismaClient.usuario.create({
      data: {
        nome: usuario.nome,
        email: usuario.email,
        senha: await bcrypt.hash(usuario.senha, 10),
        cpf: usuario.cpf,
        telefone: usuario.telefone,
        tipo: usuario.tipo,
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
    return await prismaClient.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        tipo: true,
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });
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

  async listarUsuariosDaEmpresa(empresaId: string) {
    return await prismaClient.usuario.findMany({
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
    });
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
}
