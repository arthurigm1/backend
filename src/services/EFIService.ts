import axios, { AxiosResponse } from 'axios';
import { 
  IEFICredentials, 
  IEFITokenResponse, 
  IEFICobranca, 
  IEFICobrancaResponse,
  IEFIPixResponse,
  IEFIError,
  IEFIOneStepCharge,
  IEFIOneStepChargeResponse
} from '../interface/EFI/EFI';
import dotenv from "dotenv";
dotenv.config();
export class EFIService {
  private credentials: IEFICredentials;
  private baseURL: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.credentials = {
      client_id: process.env.EFI_CLIENT_ID || '',
      client_secret: process.env.EFI_CLIENT_SECRET || ''
    };
    this.baseURL = process.env.EFI_BASE_URL || 'https://cobrancas-h.api.efipay.com.br/v1';
  }

  /**
   * Obtém token de acesso da API EFI
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Verifica se o token ainda é válido
      if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      console.log('Tentando obter token EFI com credenciais:', {
        client_id: this.credentials.client_id,
        baseURL: this.baseURL
      });

      const data = JSON.stringify({ grant_type: "client_credentials" });
      const dataCredentials = this.credentials.client_id + ":" + this.credentials.client_secret;
      
      // Codificando as credenciais em base64
      const auth = Buffer.from(dataCredentials).toString("base64");

      const config = {
        method: "POST" as const,
        url: `${this.baseURL}/authorize`,
        headers: {
          Authorization: "Basic " + auth,
          "Content-Type": "application/json",
        },
        data: data,
        timeout: 30000, // 30 segundos de timeout
      };

      console.log('Fazendo requisição para:', config.url);

      const response: AxiosResponse<IEFITokenResponse> = await axios(config);
      
      this.accessToken = response.data.access_token;
      // Define expiração com margem de segurança (5 minutos antes)
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      console.log('Token EFI obtido com sucesso');
      return this.accessToken;
    } catch (error: any) {
      console.error('Erro detalhado ao obter token EFI:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });
      
      throw new Error('Falha na autenticação com EFI Pagamentos');
    }
  }

 
  async criarCobrancaOneStep(cobranca: IEFIOneStepCharge): Promise<IEFIOneStepChargeResponse> {
    try {
      const token = await this.getAccessToken();
      
      // Injeta notification_url automaticamente se configurada no .env
      const notificationUrl = process.env.EFI_NOTIFICATION_URL;
      const payload = notificationUrl
        ? { ...cobranca, metadata: { notification_url: notificationUrl } }
        : cobranca;

      console.log('Criando cobrança one-step EFI:', JSON.stringify(payload, null, 2));
      
      const config = {
        method: "POST" as const,
        url: `${this.baseURL}/charge/one-step`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: JSON.stringify(payload),
        timeout: 30000, // 30 segundos de timeout
      };

      console.log('Fazendo requisição para:', config.url);

      const response: AxiosResponse<IEFIOneStepChargeResponse> = await axios(config);
      
      console.log('Cobrança one-step criada com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erro detalhado ao criar cobrança one-step EFI:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });
      
      throw new Error('Falha ao criar cobrança one-step na EFI Pagamentos');
    }
  }

  /**
   * Consulta cobrança na EFI pelo charge_id
   */
  async consultarCobrancaPorId(chargeId: number | string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      console.log('Consultando cobrança EFI por ID:', chargeId);

      const config = {
        method: "GET" as const,
        url: `${this.baseURL}/charge/${chargeId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      };

      const response: AxiosResponse<any> = await axios(config);
      console.log('Cobrança consultada com sucesso:', response.data);
      return response.data; // deve conter { code, data: { status, total, payment, ... } }
    } catch (error: any) {
      console.error('Erro detalhado ao consultar cobrança EFI por ID:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });
      throw new Error('Falha ao consultar cobrança na EFI Pagamentos');
    }
  }

  /**
   * Consulta detalhes de notificação na EFI pelo token de notificação
   * Retorna o histórico de eventos para uma cobrança; utilizar o último evento para estado atual
   */
  async consultarNotificacaoPorToken(tokenNotificacao: string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      console.log('Consultando notificação EFI por token:', tokenNotificacao);

      const config = {
        method: "GET" as const,
        url: `${this.baseURL}/notification/${tokenNotificacao}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      };

      const response: AxiosResponse<any> = await axios(config);
      console.log('Notificação consultada com sucesso:', response.data);
      return response.data; // esperado: { code, data: Array<eventos> }
    } catch (error: any) {
      console.error('Erro detalhado ao consultar notificação EFI por token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });
      throw new Error('Falha ao consultar notificação na EFI Pagamentos');
    }
  }
}