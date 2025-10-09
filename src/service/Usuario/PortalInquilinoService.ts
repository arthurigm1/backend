import prismaClient from "../../prisma/PrismaClient";
import { StatusFatura } from "../../generated/prisma";
import { 
  IPortalInquilinoData, 
  IFaturaInquilino, 
  ILojaInquilino, 
  INotificacaoInquilino, 
  IResumoFinanceiro 
} from "../../interface/Usuario/PortalInquilino";

export class PortalInquilinoService {
  
  /**
   * Busca todas as informações do portal do inquilino
   */
  async buscarDadosPortalInquilino(inquilinoId: string): Promise<IPortalInquilinoData> {
    // Buscar dados do inquilino
    const inquilino = await prismaClient.usuario.findUnique({
      where: { id: inquilinoId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true
      }
    });

    if (!inquilino) {
      throw new Error('Inquilino não encontrado');
    }

    // Buscar lojas e contratos do inquilino
    const lojas = await this.buscarLojasInquilino(inquilinoId);
    
    // Buscar faturas do inquilino
    const faturas = await this.buscarFaturasInquilino(inquilinoId);
    
    // Buscar notificações do inquilino
    const notificacoes = await this.buscarNotificacoes(inquilinoId);
    
    // Calcular resumo financeiro
    const resumoFinanceiro = this.calcularResumoFinanceiro(faturas);

    return {
      inquilino,
      lojas,
      faturas: this.organizarFaturasPorStatus(faturas),
      notificacoes,
      resumoFinanceiro
    };
  }

  /**
   * Busca lojas do inquilino com informações do contrato
   */
  private async buscarLojasInquilino(inquilinoId: string): Promise<ILojaInquilino[]> {
    const contratos = await prismaClient.contrato.findMany({
      where: { 
        inquilinoId,
        ativo: true 
      },
      include: {
        loja: true
      }
    });

    return contratos.map(contrato => ({
      id: contrato.loja.id,
      nome: contrato.loja.nome,
      numero: contrato.loja.numero,
      localizacao: contrato.loja.localizacao,
      contrato: {
        id: contrato.id,
        valorAluguel: contrato.valorAluguel,
        dataInicio: contrato.dataInicio,
        dataFim: contrato.dataFim,
        dataVencimento: contrato.dataVencimento,
        status: contrato.status
      }
    }));
  }

  /**
   * Busca faturas do inquilino
   */
  private async buscarFaturasInquilino(inquilinoId: string): Promise<IFaturaInquilino[]> {
    const faturas = await prismaClient.fatura.findMany({
      where: {
        contrato: {
          inquilinoId
        }
      },
      include: {
        contrato: {
          include: {
            loja: true
          }
        }
      },
      orderBy: {
        dataVencimento: 'desc'
      }
    });

    const hoje = new Date();
    
    return faturas.map(fatura => {
      const diasParaVencimento = Math.ceil((fatura.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      const diasEmAtraso = diasParaVencimento < 0 ? Math.abs(diasParaVencimento) : undefined;

      return {
        id: fatura.id,
        valorAluguel: fatura.valorAluguel,
        dataVencimento: fatura.dataVencimento,
        mesReferencia: fatura.mesReferencia,
        anoReferencia: fatura.anoReferencia,
        status: fatura.status,
        efiCobrancaId: fatura.efiCobrancaId,
        diasParaVencimento: diasParaVencimento > 0 ? diasParaVencimento : undefined,
        diasEmAtraso,
        loja: {
          id: fatura.contrato.loja.id,
          nome: fatura.contrato.loja.nome,
          numero: fatura.contrato.loja.numero,
          localizacao: fatura.contrato.loja.localizacao
        }
      };
    });
  }

  /**
   * Busca notificações do inquilino
   */
  private async buscarNotificacoes(inquilinoId: string): Promise<INotificacaoInquilino[]> {
    const notificacoes = await prismaClient.notificacao.findMany({
      where: { usuarioId: inquilinoId },
      orderBy: { enviadaEm: 'desc' },
      take: 20 // Limitar a 20 notificações mais recentes
    });

    return notificacoes.map(notificacao => ({
      id: notificacao.id,
      mensagem: notificacao.mensagem,
      tipo: notificacao.tipo,
      lida: notificacao.lida,
      enviadaEm: notificacao.enviadaEm
    }));
  }

  /**
   * Organiza faturas por status
   */
  private organizarFaturasPorStatus(faturas: IFaturaInquilino[]) {
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(hoje.getDate() + 7);

    return {
      pendentes: faturas.filter(f => f.status === StatusFatura.PENDENTE && !f.diasEmAtraso),
      emAtraso: faturas.filter(f => f.diasEmAtraso && f.diasEmAtraso > 0),
      proximasVencer: faturas.filter(f => 
        f.status === StatusFatura.PENDENTE && 
        f.diasParaVencimento && 
        f.diasParaVencimento <= 7 && 
        f.diasParaVencimento > 0
      ),
      pagas: faturas.filter(f => f.status === StatusFatura.PAGA)
    };
  }

  /**
   * Calcula resumo financeiro
   */
  private calcularResumoFinanceiro(faturas: IFaturaInquilino[]): IResumoFinanceiro {
    const faturasPendentes = faturas.filter(f => f.status === StatusFatura.PENDENTE);
    const faturasEmAtraso = faturas.filter(f => f.diasEmAtraso && f.diasEmAtraso > 0);
    const faturasPagas = faturas.filter(f => f.status === StatusFatura.PAGA);
    
    const valorTotalPendente = faturasPendentes.reduce((total, fatura) => total + fatura.valorAluguel, 0);
    
    // Próximo vencimento
    const proximoVencimento = faturasPendentes
      .filter(f => f.diasParaVencimento && f.diasParaVencimento > 0)
      .sort((a, b) => (a.diasParaVencimento || 0) - (b.diasParaVencimento || 0))[0]?.dataVencimento;

    return {
      totalFaturasPendentes: faturasPendentes.length,
      valorTotalPendente,
      faturasPagas: faturasPagas.length,
      faturasEmAtraso: faturasEmAtraso.length,
      proximoVencimento
    };
  }

  /**
   * Busca faturas por período específico
   */
  async buscarFaturasPorPeriodo(inquilinoId: string, mesReferencia: number, anoReferencia: number): Promise<IFaturaInquilino[]> {
    const faturas = await prismaClient.fatura.findMany({
      where: {
        contrato: {
          inquilinoId
        },
        mesReferencia,
        anoReferencia
      },
      include: {
        contrato: {
          include: {
            loja: true
          }
        }
      }
    });

    const hoje = new Date();
    
    return faturas.map(fatura => {
      const diasParaVencimento = Math.ceil((fatura.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      const diasEmAtraso = diasParaVencimento < 0 ? Math.abs(diasParaVencimento) : undefined;

      return {
        id: fatura.id,
        valorAluguel: fatura.valorAluguel,
        dataVencimento: fatura.dataVencimento,
        mesReferencia: fatura.mesReferencia,
        anoReferencia: fatura.anoReferencia,
        status: fatura.status,
        diasParaVencimento: diasParaVencimento > 0 ? diasParaVencimento : undefined,
        diasEmAtraso,
        loja: {
          id: fatura.contrato.loja.id,
          nome: fatura.contrato.loja.nome,
          numero: fatura.contrato.loja.numero,
          localizacao: fatura.contrato.loja.localizacao
        }
      };
    });
  }

  /**
   * Marca notificação como lida
   */
  async marcarNotificacaoComoLida(notificacaoId: string, inquilinoId: string): Promise<void> {
    await prismaClient.notificacao.updateMany({
      where: {
        id: notificacaoId,
        usuarioId: inquilinoId
      },
      data: {
        lida: true
      }
    });
  }

  async buscarFaturaComEFIPorId(efiCobrancaId: string): Promise<any | null> {
    const fatura = await prismaClient.eFICobranca.findUnique({
      where: {
        id: efiCobrancaId,
      }})
      return fatura;
}
}