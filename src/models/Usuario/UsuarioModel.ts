import { ICriarUsuario } from "../../interface/Usuario/Usuario";
import prismaClient from "../../prisma/PrismaClient";

export class UsuarioModel {
  async criarUsuario(usuario: ICriarUsuario) {
    return await prismaClient.usuario.create({
      data: {
        nome: usuario.nome,
        email: usuario.email,
        senha: usuario.senha,
      },
    });
  }
}
