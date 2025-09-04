import { z } from "zod";

const statusLojaEnum = z.enum(['VAGA', 'OCUPADA', 'INATIVA']);

export const criarLojaSchema = z.object({
  nome: z.string().min(1, "Nome da loja é obrigatório"),
  numero: z.string().min(1, "Número da loja é obrigatório"),
  localizacao: z.string().min(1, "Localização é obrigatória"),
  status: statusLojaEnum.default('VAGA'),
});

export const vincularInquilinoSchema = z.object({
  lojaId: z.string().min(1, "ID da loja é obrigatório"),
  inquilinoId: z.string().min(1, "ID do inquilino é obrigatório"),
  valorAluguel: z.number().positive("Valor do aluguel deve ser positivo"),
  dataInicio: z.string().transform((str) => new Date(str)),
  dataFim: z.string().transform((str) => new Date(str)).optional(),
  reajusteAnual: z.boolean().default(true),
});

export const atualizarStatusLojaSchema = z.object({
  status: statusLojaEnum,
});

export const editarLojaSchema = z.object({
  nome: z.string().min(1, "Nome da loja é obrigatório").optional(),
  numero: z.string().min(1, "Número da loja é obrigatório").optional(),
  localizacao: z.string().min(1, "Localização é obrigatória").optional(),
  status: statusLojaEnum.optional(),
  vincularInquilino: z.object({
    inquilinoId: z.string().min(1, "ID do inquilino é obrigatório"),
  }).optional(),
  desvincularInquilino: z.boolean().optional(),
});