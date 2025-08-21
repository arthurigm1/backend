import { string, z } from "zod";
import { criarEmpresaSchema } from "./Empresa.schema";

const tipoUsuarioEnum = z.enum(['ADMIN_EMPRESA', 'FUNCIONARIO', 'INQUILINO']);

export const criarUsuarioComEmpresaSchema = z.object({
  nome: string().nonempty({ message: "Nome é obrigatório!" }),
  email: string().email({ message: "Email inválido" }),
  senha: string()
    .nonempty({ message: "Senha é obrigatória!" })
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  empresaId: string().nonempty({ message: "ID da empresa é obrigatório!" }),
});

export const criarUsuarioSchema = z.object({
  nome: string().nonempty({ message: "Nome é obrigatório!" }),
  email: string().email({ message: "Email inválido" }),
  senha: string()
    .nonempty({ message: "Senha é obrigatória!" })
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  cpf: string().optional(),
  telefone: string().optional(),
  empresaId: string().nonempty({ message: "ID da empresa é obrigatório!" }),
  tipo: tipoUsuarioEnum,
});

export const criarInquilinoSchema = z.object({
  nome: string().nonempty({ message: "Nome é obrigatório!" }),
  email: string().email({ message: "Email inválido" }),
  senha: string()
    .nonempty({ message: "Senha é obrigatória!" })
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

export const loginUsuarioSchema = z.object({
  email: string().email({ message: "Email inválido" }),
  senha: string()
    .nonempty({ message: "Senha é obrigatória!" })
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

export const solicitarRedefinicaoSenhaSchema = z.object({
  email: string().email({ message: "Email inválido" }),
});

export const redefinirSenhaSchema = z.object({
  token: string().nonempty({ message: "Token é obrigatório!" }),
  novaSenha: string()
    .nonempty({ message: "Nova senha é obrigatória!" })
    .min(6, { message: "Nova senha deve ter no mínimo 6 caracteres" }),
});
