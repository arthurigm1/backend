// UsuarioController.ts
import { Request, Response } from "express";
import { criarUsuarioSchema } from "../../schema/Usuario.schema";
import { UsuarioService } from "../../service/Usuario/UsuarioService";

const usuarioService = new UsuarioService();

export class UsuarioController {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const data = criarUsuarioSchema.safeParse(req.body);
      if(!data.success){
        return res.status(400).json({ error: "Dados inválidos" });
      }
      const usuarioCriado = await usuarioService.criarUsuario(data.data);
      return res.status(201).json();
    } catch (error) {
      return res.status(500).json({
      error,
      });
    }
  }
}