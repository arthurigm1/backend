import { StatusFatura } from "../../generated/prisma";

export interface ICriarFatura {
  contratoId: string;
  mesReferencia: number;
  anoReferencia: number;
  valorAluguel: number;
  valorReajustado?: number;
  dataVencimento: Date;
  observacoes?: string;
  // Campos EFI removidos - agora estão na tabela EFICobranca
}

export interface IFiltrosFatura {
  contratoId?: string;
  mesReferencia?: number;
  anoReferencia?: number;
  status?: StatusFatura;
  page?: number;
  limit?: number;
}

export interface IFaturaCompleta {
  id: string;
  contratoId: string;
  numeroFatura: string;
  mesReferencia: number;
  anoReferencia: number;
  valorAluguel: number;
  valorReajustado?: number;
  dataVencimento: Date;
  dataGeracao: Date;
  status: StatusFatura;
  observacoes?: string;
  // Campos EFI removidos - agora estão na tabela EFICobranca
  contrato: {
    id: string;
    valorAluguel: number;
    dataInicio: Date;
    dataFim: Date;
    loja: {
      id: string;
      nome: string;
      numero: string;
      localizacao: string;
    };
    inquilino: {
      id: string;
      nome: string;
      email: string;
      telefone?: string;
    };
  };
  pagamentos: Array<{
    id: string;
    valor: number;
    dataVenc: Date;
    dataPag?: Date;
    status: string;
  }>;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface IRespostaListaFaturas {
  faturas: IFaturaCompleta[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IGerarFaturasMensaisRequest {
  mesReferencia: number;
  anoReferencia: number;
}

export interface IFaturaGeradaResponse {
  id: string;
  numeroFatura: string;
  contratoId: string;
  valorAluguel: number;
  valorReajustado?: number;
  dataVencimento: Date;
  mesReferencia: number;
  anoReferencia: number;
  // Campos EFI removidos - agora estão na tabela EFICobranca
}