import nodemailer from 'nodemailer';
import { ApiError } from '../../utils/apiError';

export class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: "arthurmartinsig1@gmail.com",
        pass: "gwmv pzox kufv mbqd"
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async enviarEmailRedefinicaoSenha(email: string, nome: string, token: string): Promise<void> {
    try {

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/redefinir-senha?token=${token}`;

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Redefinição de Senha - Sistema de Gestão',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Redefinição de Senha</h2>
            
            <p>Olá <strong>${nome}</strong>,</p>
            
            <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            
            <p>Ou copie e cole o link abaixo em seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <p><strong>Este link expira em 1 hora.</strong></p>
            
            <p>Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Este é um email automático, não responda.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de redefinição de senha enviado para: ${email}`);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw new ApiError(500, 'Erro ao enviar email de redefinição de senha');
    }
  }

  async enviarEmailFatura(
    email: string,
    nome: string,
    lojaNome: string,
    mesReferencia: number,
    anoReferencia: number,
    valorAluguel: number,
    dataVencimento: Date,
    cobranca: {
      barcode?: string;
      pixQrcode?: string;
      pixQrcodeImage?: string;
      link?: string;
      billetLink?: string;
      pdfLink?: string;
      expireAt?: string | Date;
      status?: string;
    }
  ): Promise<void> {
    try {
      const valorFormatado = valorAluguel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const vencimentoFormatado = new Date(dataVencimento).toLocaleDateString('pt-BR');

      const pixSection = cobranca.pixQrcode || cobranca.pixQrcodeImage ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #333;">Pagamento via PIX</h3>
          ${cobranca.pixQrcode ? `<p style="font-size: 12px; color: #555;">Copie e cole o código PIX abaixo no seu aplicativo bancário:</p>
          <pre style="white-space: pre-wrap; word-break: break-all; background: #f7f7f7; padding: 12px; border-radius: 6px;">${cobranca.pixQrcode}</pre>` : ''}
          ${cobranca.pixQrcodeImage ? `<p style="font-size: 12px; color: #555;">Ou escaneie o QR Code:</p>
          <img src="${cobranca.pixQrcodeImage}" alt="QR Code PIX" style="max-width: 240px; border: 1px solid #eee; border-radius: 6px;"/>` : ''}
        </div>
      ` : '';

      const boletoSection = cobranca.barcode || cobranca.billetLink || cobranca.pdfLink ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #333;">Pagamento via Boleto</h3>
          ${cobranca.barcode ? `<p style="font-size: 12px; color: #555;">Linha digitável do boleto:</p>
          <pre style="white-space: pre-wrap; word-break: break-all; background: #f7f7f7; padding: 12px; border-radius: 6px;">${cobranca.barcode}</pre>` : ''}
          ${cobranca.billetLink ? `<p><a href="${cobranca.billetLink}" style="color: #007bff;">Abrir boleto na web</a></p>` : ''}
          ${cobranca.pdfLink ? `<p><a href="${cobranca.pdfLink}" style="color: #007bff;">Baixar boleto em PDF</a></p>` : ''}
        </div>
      ` : '';

      const cobrancaLink = cobranca.link ? `<p style="margin-top: 12px;"><a href="${cobranca.link}" style="color: #007bff;">Visualizar cobrança completa</a></p>` : '';

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: `Fatura criada - ${lojaNome} (${mesReferencia}/${anoReferencia})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Sua Fatura Foi Gerada</h2>
            <p>Olá <strong>${nome}</strong>,</p>
            <p>Sua fatura referente ao mês <strong>${mesReferencia}/${anoReferencia}</strong> da loja <strong>${lojaNome}</strong> foi criada.</p>
            <ul style="list-style: none; padding-left: 0; color: #333;">
              <li><strong>Valor:</strong> ${valorFormatado}</li>
              <li><strong>Vencimento:</strong> ${vencimentoFormatado}</li>
            </ul>
            ${pixSection}
            ${boletoSection}
            ${cobrancaLink}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Este é um email automático, não responda.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de fatura criado enviado para: ${email}`);
    } catch (error) {
      console.error('Erro ao enviar email de fatura:', error);
      throw new ApiError(500, 'Erro ao enviar email de fatura');
    }
  }

  async enviarEmailConfirmacaoRedefinicao(email: string, nome: string): Promise<void> {
    try {

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Senha Redefinida com Sucesso - Sistema de Gestão',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745; text-align: center;">Senha Redefinida com Sucesso</h2>
            
            <p>Olá <strong>${nome}</strong>,</p>
            
            <p>Sua senha foi redefinida com sucesso em ${new Date().toLocaleString('pt-BR')}.</p>
            
            <p>Se você não fez esta alteração, entre em contato conosco imediatamente.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Este é um email automático, não responda.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de confirmação enviado para: ${email}`);
    } catch (error) {
      console.error('Erro ao enviar email de confirmação:', error);
      throw new ApiError(500, 'Erro ao enviar email de confirmação');
    }
  }

  // Enviar email de notificação geral com assunto e mensagem personalizados
  async enviarEmailNotificacaoGeral(email: string, nome: string, assunto: string, mensagem: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: assunto,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">${assunto}</h2>
            
            <p>Olá <strong>${nome}</strong>,</p>
            
            <p style="color: #333;">${mensagem}</p>
            
            <p style="color: #666; font-size: 12px;">Este é um comunicado automático do Sistema de Gestão.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Este é um email automático, não responda.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email de notificação enviado para: ${email}`);
    } catch (error) {
      console.error('Erro ao enviar email de notificação:', error);
      throw new ApiError(500, 'Erro ao enviar email de notificação');
    }
  }
}

export const emailService = new EmailService();