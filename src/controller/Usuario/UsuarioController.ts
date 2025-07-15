// UsuarioController.ts
import { Request, Response } from "express";
import {
  criarUsuarioSchema,
  loginUsuarioSchema,
} from "../../schema/Usuario.schema";
import { UsuarioService } from "../../service/Usuario/UsuarioService";
import { MENSAGEM_SUCESSO_USER_CRIADO } from "../../constants/sucesso";

const usuarioService = new UsuarioService();

export class UsuarioController {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarUsuarioSchema.safeParse(req.body);
      if (!data.success) {
        return res.status(400).json({ error: "Dados inválidos" });
      }
      const usuarioCriado = await usuarioService.criarUsuario(data.data);
      return res.status(200).json({
        sucesso: true,
        mensagem: MENSAGEM_SUCESSO_USER_CRIADO,
        token: usuarioCriado,
      });
    } catch (error) {
      return res.status(500).json({
        error,
      });
    }
  }
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const loginusuario = await loginUsuarioSchema.safeParse(req.body);
      if (!loginusuario.success) {
        return res.status(400).json({ error: "Dados inválidos" });
      }
      const usuario = await usuarioService.login(loginusuario.data);
      return res.status(200).json(usuario);
    } catch (error) {
      console.error("Erro desconhecido no login:", error);
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }
  }
  async teste(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json("teste ok");
    } catch (error) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }
  }
}
