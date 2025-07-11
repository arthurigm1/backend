import { criarUsuarioSchema } from "../../schema/Usuario.schema";
import { UsuarioService } from "../../service/Usuario/UsuarioService";
import { Request, Response } from "express";

const usuarioService = new UsuarioService();

export class UsuarioController {
  async criarUsuario(req: Request, res: Response) {
    try {
      const data = criarUsuarioSchema.parse(req.body);
      const usuarioCriado = await usuarioService.criarUsuario(data);
      res.status(201).json(usuarioCriado);
    } catch (error) {
      return res
        .status(500)
        .json({
          error: error instanceof Error ? error.message : String(error),
        });
    }
  }
}
