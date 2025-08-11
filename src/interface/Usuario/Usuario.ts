export interface ICriarUsuario {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  empresaId: string;
  tipo: 'ADMIN_EMPRESA' | 'FUNCIONARIO' | 'INQUILINO';
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
  tipo: 'ADMIN_EMPRESA' | 'FUNCIONARIO' | 'INQUILINO';
  empresaId: string;
  criadoEm: Date;
}
