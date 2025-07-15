import { ICriarUsuario, ILoginUsuario } from "../../interface/Usuario/Usuario";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../../utils/jwt";

const usuarioModel = new UsuarioModel();

export class UsuarioService {
  async criarUsuario(data: ICriarUsuario) {
    const usuario = await usuarioModel.criarUsuario(data);
    const token = generateAccessToken({
      id: (usuario as any).id,
      email: usuario.email,
    });
    return token;
  }

  async login(data: ILoginUsuario) {
    const usuario = await usuarioModel.login(data.email);

    if (!usuario) {
      throw new Error("Usuário ou senha inválidos");
    }
    // Certifique-se de que o usuário possui um campo 'id'
    if (!("id" in usuario)) {
      throw new Error("Usuário retornado não possui campo 'id'");
    }
    const senhaValida = await bcrypt.compare(data.senha, usuario.senha);
    if (!senhaValida) {
      throw new Error("Usuário ou senha inválidos");
    }
    const token = generateAccessToken({
      id: (usuario as any).id,
      email: usuario.email,
    });
    const { senha, ...usuarioSemSenha } = usuario;
    return { usuario: usuarioSemSenha, token };
  }
}
