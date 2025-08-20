import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { ApiError } from '../../utils/apiError';

const OAuth2 = google.auth.OAuth2;

export class EmailService {
  private oauth2Client: any;
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const accessToken = await this.oauth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken.token,
        },
      });
    } catch (error) {
      console.error('Erro ao inicializar transporter de email:', error);
      throw new ApiError(500, 'Erro na configuração do serviço de email');
    }
  }

  async enviarEmailRedefinicaoSenha(email: string, nome: string, token: string): Promise<void> {
    try {
      // Reinicializar transporter para garantir token válido
      await this.initializeTransporter();

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/redefinir-senha?token=${token}`;

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

  async enviarEmailConfirmacaoRedefinicao(email: string, nome: string): Promise<void> {
    try {
      await this.initializeTransporter();

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
      // Não lançar erro aqui pois a senha já foi alterada com sucesso
    }
  }
}

export const emailService = new EmailService();