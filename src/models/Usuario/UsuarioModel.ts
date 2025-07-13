import { ICriarUsuario, ILoginUsuario } from "../../interface/Usuario/Usuario";
import prismaClient from "../../prisma/PrismaClient";
import bcrypt from "bcrypt";

export class UsuarioModel {
  async criarUsuario(usuario: ICriarUsuario) {
    return await prismaClient.usuario.create({
      data: {
        nome: usuario.nome,
        email: usuario.email,
        senha: await bcrypt.hash(usuario.senha, 10),
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
      },
    });
  }
}
