import { string, z } from "zod";

export const criarEmpresaSchema = z.object({
  nome: string().nonempty({ message: "Nome da empresa é obrigatório!" }),
  cnpj: string()
    .nonempty({ message: "CNPJ é obrigatório!" })
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, {
      message: "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX ou conter 14 dígitos"
    }),
});