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
    // Executar todas as queries em paralelo para melhor performance
    const [inquilino, contratos, faturas, notificacoes] = await Promise.all([
      // Buscar dados do inquilino
      prismaClient.usuario.findUnique({
        where: { id: inquilinoId },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true
        }
      }),
      
      // Buscar contratos com lojas em uma única query
      prismaClient.contrato.findMany({
        where: { 
          inquilinoId,
        },
        include: {
          loja: true
        }
      }),
      
      // Buscar faturas com contratos e lojas em uma única query otimizada
      prismaClient.fatura.findMany({
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
      }),
      
      // Buscar notificações
      prismaClient.notificacao.findMany({
        where: { usuarioId: inquilinoId },
        orderBy: { enviadaEm: 'desc' },
        take: 20 // Limitar a 20 notificações mais recentes
      })
    ]);

    if (!inquilino) {
      throw new Error('Inquilino não encontrado');
    }

    // Processar lojas a partir dos contratos
    const lojas: ILojaInquilino[] = contratos.map(contrato => ({
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

    // Processar faturas com cálculos de vencimento
    const hoje = new Date();
    const faturasProcessadas: IFaturaInquilino[] = faturas.map(fatura => {
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

    // Processar notificações
    const notificacoesProcessadas: INotificacaoInquilino[] = notificacoes.map(notificacao => ({
      id: notificacao.id,
      mensagem: notificacao.mensagem,
      tipo: notificacao.tipo,
      lida: notificacao.lida,
      enviadaEm: notificacao.enviadaEm
    }));
    
    // Calcular resumo financeiro
    const resumoFinanceiro = this.calcularResumoFinanceiro(faturasProcessadas);

    return {
      inquilino,
      lojas,
      faturas: this.organizarFaturasPorStatus(faturasProcessadas),
      notificacoes: notificacoesProcessadas,
      resumoFinanceiro
    };
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