import { TipoUsuario } from '../../generated/prisma';

export interface ICriarUsuario {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  empresaId: string;
  tipo: TipoUsuario;
}

export interface ICriarUsuarioComEmpresa {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  empresa: {
    nome: string;
    cnpj: string;
  };
}

export interface ICriarInquilino {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
}

export interface ILoginUsuario {
  email: string;
  senha: string;
}

export interface IUsuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  tipo: TipoUsuario;
  empresaId: string;
  criadoEm: Date;
}
