import { z } from "zod";

const statusContratoEnum = z.enum(['ATIVO', 'VENCIDO', 'RESCINDIDO', 'SUSPENSO']);

export const criarContratoSchema = z.object({
  lojaId: z.string().min(1, "ID da loja é obrigatório"),
  inquilinoId: z.string().min(1, "ID do inquilino é obrigatório"),
  valorAluguel: z.number().positive("Valor do aluguel deve ser positivo"),
  dataInicio: z.string().transform((str) => new Date(str)),
  dataFim: z.string().transform((str) => new Date(str)),
  reajusteAnual: z.boolean().default(false),
  percentualReajuste: z.number().min(0, "Percentual de reajuste não pode ser negativo").max(100, "Percentual de reajuste não pode ser maior que 100%").optional(),
  clausulas: z.string().max(2000, "Cláusulas não podem exceder 2000 caracteres").optional(),
  observacoes: z.string().max(1000, "Observações não podem exceder 1000 caracteres").optional(),
}).refine((data) => {
  return data.dataFim > data.dataInicio;
}, {
  message: "A data de fim deve ser posterior à data de início",
  path: ["dataFim"]
});

export const atualizarContratoSchema = z.object({
  valorAluguel: z.number().positive("Valor do aluguel deve ser positivo").optional(),
  dataFim: z.string().transform((str) => new Date(str)).optional(),
  reajusteAnual: z.boolean().optional(),
  percentualReajuste: z.number().min(0, "Percentual de reajuste não pode ser negativo").max(100, "Percentual de reajuste não pode ser maior que 100%").optional(),
  clausulas: z.string().max(2000, "Cláusulas não podem exceder 2000 caracteres").optional(),
  observacoes: z.string().max(1000, "Observações não podem exceder 1000 caracteres").optional(),
  status: statusContratoEnum.optional(),
  ativo: z.boolean().optional(),
});

export const rescindirContratoSchema = z.object({
  observacoes: z.string().max(1000, "Observações não podem exceder 1000 caracteres").optional(),
});

export const renovarContratoSchema = z.object({
  novaDataFim: z.string().transform((str) => new Date(str)),
  novoValor: z.number().positive("Novo valor do aluguel deve ser positivo").optional(),
}).refine((data) => {
  return data.novaDataFim > new Date();
}, {
  message: "A nova data de fim deve ser futura",
  path: ["novaDataFim"]
});

export const filtrosContratoSchema = z.object({
  status: statusContratoEnum.optional(),
  ativo: z.string().transform((str) => str === 'true').optional(),
  lojaId: z.string().optional(),
  inquilinoId: z.string().optional(),
  dataInicioMin: z.string().transform((str) => new Date(str)).optional(),
  dataInicioMax: z.string().transform((str) => new Date(str)).optional(),
  dataFimMin: z.string().transform((str) => new Date(str)).optional(),
  dataFimMax: z.string().transform((str) => new Date(str)).optional(),
  page: z.string().transform((str) => parseInt(str, 10)).refine((num) => num > 0, "Página deve ser maior que 0").optional(),
  limit: z.string().transform((str) => parseInt(str, 10)).refine((num) => num > 0 && num <= 100, "Limite deve ser entre 1 e 100").optional(),
});

export const buscarContratosVencendoSchema = z.object({
  dias: z.string().transform((str) => parseInt(str, 10)).refine((num) => num >= 0, "Dias deve ser um número não negativo").default('30'),
});

// Schema para validação de parâmetros de ID
export const contratoIdSchema = z.object({
  id: z.string().min(1, "ID do contrato é obrigatório"),
});