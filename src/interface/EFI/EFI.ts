export interface IEFICredentials {
  client_id: string;
  client_secret: string;
}

export interface IEFITokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface IEFICobranca {
  calendario: {
    expiracao: number;
  };
  devedor: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  valor: {
    original: string;
  };
  chave: string;
  solicitacaoPagador?: string;
  infoAdicionais?: Array<{
    nome: string;
    valor: string;
  }>;
}

export interface IEFICobrancaResponse {
  txid: string;
  revisao: number;
  loc: {
    id: number;
    location: string;
    tipoCob: string;
    criacao: string;
  };
  location: string;
  status: string;
  devedor: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  valor: {
    original: string;
  };
  chave: string;
  solicitacaoPagador?: string;
  pixCopiaECola: string;
  qrcode: string;
}

export interface IEFIPixResponse {
  endToEndId: string;
  txid: string;
  valor: string;
  horario: string;
  infoPagador?: string;
  devolucoes?: Array<{
    id: string;
    rtrId: string;
    valor: string;
    horario: {
      solicitacao: string;
      liquidacao?: string;
    };
    status: string;
  }>;
}

export interface IEFIWebhookPix {
  pix: IEFIPixResponse[];
}

export interface IEFIError {
  nome: string;
  mensagem: string;
  codigo?: string;
}

// Interfaces para One-Step Charge Creation
export interface IEFIOneStepItem {
  name: string;
  value: number; // valor em centavos
  amount: number;
}

export interface IEFICustomerAddress {
  street: string;
  number: string;
  neighborhood: string;
  zipcode: string;
  city: string;
  complement?: string;
  state: string;
}

export interface IEFICustomer {
  name: string;
  cpf: string;
  cnpj?: string;
  email: string;
  phone_number: string;
  address: IEFICustomerAddress;
}

export interface IEFIBankingBilletConfigurations {
  fine?: number; // multa em centavos
  interest?: number; // juros em centavos
}

export interface IEFIBankingBillet {
  customer: IEFICustomer;
  expire_at: string; // formato: YYYY-MM-DD
  configurations?: IEFIBankingBilletConfigurations;
  message?: string;
}

export interface IEFIOneStepPayment {
  banking_billet: IEFIBankingBillet;
}

export interface IEFIOneStepCharge {
  items: IEFIOneStepItem[];
  payment: IEFIOneStepPayment;
}

export interface IEFIOneStepPixData {
  qrcode: string; // BRCode ou copia e cola
  qrcode_image: string; // QR Code imagem em base64
}

export interface IEFIOneStepPdfData {
  charge: string; // link do PDF da cobrança
}

export interface IEFIOneStepChargeResponse {
  code: number;
  data: {
    barcode: string; // linha digitável do boleto
    pix: IEFIOneStepPixData;
    link: string; // link responsivo do Bolix
    billet_link: string; // link do Bolix
    pdf: IEFIOneStepPdfData;
    expire_at: string; // data de vencimento
    charge_id: number; // ID da transação
    status: string; // status da cobrança
    total: number; // valor total em centavos
    payment: string; // forma de pagamento
  };
}