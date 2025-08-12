import { z } from "zod";

const tipoNotificacaoEnum = z.enum([
  'PAGAMENTO_VENCIDO',
  'PAGAMENTO_PROXIMO_VENCIMENTO', 
  'PAGAMENTO_REALIZADO',
  'CONTRATO_VENCIMENTO',
  'GERAL'
]);

export const criarNotificacaoSchema = z.object({
  usuarioId: z.string().min(1, "ID do usuário é obrigatório"),
  mensagem: z.string().min(1, "Mensagem é obrigatória").max(500, "Mensagem muito longa"),
  tipo: tipoNotificacaoEnum.optional(),
});

export const filtroNotificacoesSchema = z.object({
  usuarioId: z.string().optional(),
  tipo: tipoNotificacaoEnum.optional(),
  lida: z.boolean().optional(),
  dataInicio: z.string().transform((str) => new Date(str)).optional(),
  dataFim: z.string().transform((str) => new Date(str)).optional(),
});

export const marcarComoLidaSchema = z.object({
  notificacaoId: z.string().min(1, "ID da notificação é obrigatório"),
});