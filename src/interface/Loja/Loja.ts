import { StatusLoja } from '../../generated/prisma';

export interface ICriarLoja {
  nome: string;
  numero: string;
  localizacao: string;
  m2?: number;
  status: StatusLoja;
  empresaId: string;
}

export interface ILoja {
  id: string;
  nome: string;
  numero: string;
  localizacao: string;
  m2?: number | null;
  status: StatusLoja;
  empresaId: string;
  criadoEm: Date;
}

export interface IAtualizarLoja {
  nome?: string;
  numero?: string;
  localizacao?: string;
  m2?: number;
  status?: StatusLoja;
}

export interface IVincularInquilino {
  lojaId: string;
  inquilinoId: string;
  valorAluguel: number;
  dataInicio: Date;
  dataFim?: Date;
  reajusteAnual: boolean;
}