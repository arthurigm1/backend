import { StatusContrato } from '../../generated/prisma';

export interface ICriarContrato {
  lojaId: string;
  inquilinoId: string;
  valorAluguel: number;
  dataInicio: Date;
  dataFim: Date;
  dataVencimento: number; // Dia do mês para vencimento das faturas (1-31)
  reajusteAnual?: boolean;
  percentualReajuste?: number;
  clausulas?: string;
  observacoes?: string;
}

export interface IContrato {
  id: string;
  lojaId: string;
  inquilinoId: string;
  valorAluguel: number;
  dataInicio: Date;
  dataFim: Date;
  dataVencimento: number; // Dia do mês para vencimento das faturas (1-31)
  reajusteAnual: boolean;
  percentualReajuste: number | null;
  clausulas: string | null;
  observacoes: string | null;
  status: StatusContrato;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface IAtualizarContrato {
  valorAluguel?: number;
  dataFim?: Date;
  dataVencimento?: number;
  reajusteAnual?: boolean;
  percentualReajuste?: number;
  clausulas?: string;
  observacoes?: string;
  status?: StatusContrato;
}

export interface IFiltrosContrato {
  status?: StatusContrato;
  lojaId?: string;
  inquilinoId?: string;
  dataInicioMin?: Date;
  dataInicioMax?: Date;
  dataFimMin?: Date;
  dataFimMax?: Date;
}

export interface IContratoComRelacoes extends IContrato {
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
    cpf: string | null;
    telefone: string | null;
  };
}

export interface IListarContratosResponse {
  contratos: IContratoComRelacoes[];
  totalContratos: number;
  totalPaginas: number;
}