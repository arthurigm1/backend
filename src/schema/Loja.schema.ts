import { z } from "zod";

const statusLojaEnum = z.enum(['VAGA', 'OCUPADA', 'INATIVA']);

export const criarLojaSchema = z.object({
  nome: z.string().min(1, "Nome da loja é obrigatório"),
  numero: z.string().min(1, "Número da loja é obrigatório"),
  metragem: z.number().positive("Metragem deve ser um número positivo"),
  localizacao: z.string().min(1, "Localização é obrigatória"),
  status: statusLojaEnum.default('VAGA'),
  empresaId: z.string().min(1, "ID da empresa é obrigatório"),
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