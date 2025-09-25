import { StatusFatura } from "../../generated/prisma";

export interface IFaturaInquilino {
  id: string;
  valorAluguel: number;
  dataVencimento: Date;
  mesReferencia: number;
  anoReferencia: number;
  status: StatusFatura;
  diasParaVencimento?: number;
  diasEmAtraso?: number;
  loja: {
    id: string;
    nome: string;
    numero: string;
    localizacao: string;
  };
}

export interface ILojaInquilino {
  id: string;
  nome: string;
  numero: string;
  localizacao: string;
  contrato: {
    id: string;
    valorAluguel: number;
    dataInicio: Date;
    dataFim: Date;
    dataVencimento: number;
    status: string;
  };
}

export interface INotificacaoInquilino {
  id: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  enviadaEm: Date;
}

export interface IResumoFinanceiro {
  totalFaturasPendentes: number;
  valorTotalPendente: number;
  faturasPagas: number;
  faturasEmAtraso: number;
  proximoVencimento?: Date;
}

export interface IPortalInquilinoData {
  inquilino: {
    id: string;
    nome: string;
    email: string;
    telefone?: string | null;
  };
  lojas: ILojaInquilino[];
  faturas: {
    pendentes: IFaturaInquilino[];
    emAtraso: IFaturaInquilino[];
    proximasVencer: IFaturaInquilino[];
    pagas: IFaturaInquilino[];
  };
  notificacoes: INotificacaoInquilino[];
  resumoFinanceiro: IResumoFinanceiro;
}