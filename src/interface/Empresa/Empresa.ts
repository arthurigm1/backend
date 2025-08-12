export interface ICriarEmpresa {
  nome: string;
  cnpj: string;
}

export interface IEmpresa {
  id: string;
  nome: string;
  cnpj: string;
  criadoEm: Date;
}

export interface IAtualizarEmpresa {
  nome?: string;
  cnpj?: string;
}