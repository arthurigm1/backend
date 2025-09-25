import { z } from "zod";
import { StatusFatura } from "../generated/prisma";

export const gerarFaturasMensaisSchema = z.object({
  mesReferencia: z.number()
    .int()
    .min(1, "Mês deve ser entre 1 e 12")
    .max(12, "Mês deve ser entre 1 e 12"),
  anoReferencia: z.number()
    .int()
    .min(2020, "Ano deve ser maior que 2020")
    .max(2050, "Ano deve ser menor que 2050")
});

export const filtrosFaturaSchema = z.object({
  contratoId: z.string().uuid().optional(),
  mesReferencia: z.coerce.number()
    .int()
    .min(1, "Mês deve ser entre 1 e 12")
    .max(12, "Mês deve ser entre 1 e 12")
    .optional(),
  anoReferencia: z.coerce.number()
    .int()
    .min(2020, "Ano deve ser maior que 2020")
    .max(2050, "Ano deve ser menor que 2050")
    .optional(),
  status: z.nativeEnum(StatusFatura).optional(),
  page: z.coerce.number()
    .int()
    .positive("Página deve ser um número positivo")
    .default(1),
  limit: z.coerce.number()
    .int()
    .min(1, "Limite deve ser no mínimo 1")
    .max(100, "Limite deve ser no máximo 100")
    .default(10)
});

export const atualizarStatusFaturaSchema = z.object({
  status: z.nativeEnum(StatusFatura, {
    required_error: "Status é obrigatório",
    invalid_type_error: "Status inválido"
  })
});

export const faturaIdSchema = z.object({
  id: z.string().uuid("ID da fatura deve ser um UUID válido")
});

export type GerarFaturasMensaisData = z.infer<typeof gerarFaturasMensaisSchema>;
export type FiltrosFaturaData = z.infer<typeof filtrosFaturaSchema>;
export type AtualizarStatusFaturaData = z.infer<typeof atualizarStatusFaturaSchema>;
export type FaturaIdData = z.infer<typeof faturaIdSchema>;