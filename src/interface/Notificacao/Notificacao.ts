import { TipoNotificacao, TipoUsuario } from '../../generated/prisma';

export interface ICriarNotificacao {
  usuarioId: string;
  mensagem: string;
  tipo?: TipoNotificacao;
}

export interface INotificacao {
  id: string;
  usuarioId: string;
  mensagem: string;
  tipo: TipoNotificacao;
  lida: boolean;
  enviadaEm: Date;
}

export interface INotificacaoComUsuario extends INotificacao {
  usuario: {
    id: string;
    nome: string;
    email: string;
    tipo: TipoUsuario;
  };
}

export interface IFiltroNotificacoes {
  usuarioId?: string;
  tipo?: TipoNotificacao;
  lida?: boolean;
  dataInicio?: Date;
  dataFim?: Date;
}