import { number, string, z } from "zod";

export const criarUsuarioSchema = z.object({
  nome: string().nonempty({ message: "Campo Obrigatorio!" }),
  email: string().nonempty({ message: "Campo Obrigatorio!" }),
  senha: string()
    .nonempty({ message: "Campo Obrigatorio!" })
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});
