import { StatusPagamento } from '../../generated/prisma';

export interface ICriarPagamento {
  contratoId: string;
  usuarioId: string;
  valor: number;
  dataVenc: Date;
  status?: StatusPagamento;
}

export interface IPagamento {
  id: string;
  contratoId: string;
  usuarioId: string;
  valor: number;
  dataVenc: Date;
  dataPag: Date | null;
  status: StatusPagamento;
  criadoEm: Date;
}

export interface IAtualizarPagamento {
  dataPag?: Date | null;
  status?: StatusPagamento;
}

export interface IPagamentoComDetalhes extends IPagamento {
  contrato: {
    id: string;
    valorAluguel: number;
    loja: {
      nome: string;
      numero: string;
    };
  };
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
}