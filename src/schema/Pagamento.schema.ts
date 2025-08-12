import { z } from "zod";

const statusPagamentoEnum = z.enum(['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO']);

export const criarPagamentoSchema = z.object({
  contratoId: z.string().min(1, "ID do contrato é obrigatório"),
  usuarioId: z.string().min(1, "ID do usuário é obrigatório"),
  valor: z.number().positive("Valor deve ser positivo"),
  dataVenc: z.string().transform((str) => new Date(str)),
  status: statusPagamentoEnum.default('PENDENTE'),
});

export const atualizarPagamentoSchema = z.object({
  dataPag: z.string().transform((str) => new Date(str)).optional(),
  status: statusPagamentoEnum.optional(),
});

export const marcarComoPagoSchema = z.object({
  pagamentoId: z.string().min(1, "ID do pagamento é obrigatório"),
});

export const filtroEstatisticasSchema = z.object({
  empresaId: z.string().min(1, "ID da empresa é obrigatório"),
  dataInicio: z.string().transform((str) => new Date(str)).optional(),
  dataFim: z.string().transform((str) => new Date(str)).optional(),
});