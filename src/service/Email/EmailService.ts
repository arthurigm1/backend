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
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async enviarEmailRedefinicaoSenha(email: string, nome: string, token: string): Promise<void> {
    try {

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
}

export const emailService = new EmailService();