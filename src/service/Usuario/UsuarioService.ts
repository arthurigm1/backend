import { ICriarUsuario } from "../../interface/Usuario/Usuario";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";


const usuarioModel = new UsuarioModel();


export class UsuarioService { 
     async criarUsuario(usuario: ICriarUsuario) {
    return await usuarioModel.criarUsuario(usuario);
  }
}