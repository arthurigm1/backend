
import { ICriarNotificacao, INotificacao, INotificacaoComUsuario, IFiltroNotificacoes } from "../../interface/Notificacao/Notificacao";
import { PrismaClient, TipoNotificacao } from "../../generated/prisma";

const prismaClient = new PrismaClient();

export class NotificacaoModel {
  async criarNotificacao(data: ICriarNotificacao): Promise<INotificacao> {
    return await prismaClient.notificacao.create({
      data: {
        usuarioId: data.usuarioId,
        mensagem: data.mensagem,
        tipo: data.tipo || TipoNotificacao.GERAL,
        lida: false,
      },
    }) as INotificacao;

  }

  async buscarPorId(id: string): Promise<INotificacao | null> {
    return await prismaClient.notificacao.findUnique({
      where: { id },
    });
  }

  async buscarPorIdComUsuario(id: string): Promise<INotificacaoComUsuario | null> {
    return await prismaClient.notificacao.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
          },
        },
      },
    });
  }

  async listarNotificacoesPorUsuario(usuarioId: string, limite?: number): Promise<INotificacao[]> {
    return await prismaClient.notificacao.findMany({
      where: { usuarioId },
      orderBy: {
        enviadaEm: 'desc',
      },
      take: limite,
    });
  }

  async listarNotificacoesNaoLidas(usuarioId: string): Promise<INotificacao[]> {
    return await prismaClient.notificacao.findMany({
      where: {
        usuarioId,
        lida: false,
      },
      orderBy: {
        enviadaEm: 'desc',
      },
    });
  }

  async listarNotificacoesComFiltro(filtro: IFiltroNotificacoes): Promise<INotificacaoComUsuario[]> {
    const where: any = {};

    if (filtro.usuarioId) {
      where.usuarioId = filtro.usuarioId;
    }

    if (filtro.tipo) {
      where.tipo = filtro.tipo;
    }

    if (filtro.lida !== undefined) {
      where.lida = filtro.lida;
    }

    if (filtro.dataInicio || filtro.dataFim) {
      where.enviadaEm = {};
      if (filtro.dataInicio) {
        where.enviadaEm.gte = filtro.dataInicio;
      }
      if (filtro.dataFim) {
        where.enviadaEm.lte = filtro.dataFim;
      }
    }

    return await prismaClient.notificacao.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
          },
        },
      },
      orderBy: {
        enviadaEm: 'desc',
      },
    });
  }

  async marcarComoLida(id: string): Promise<INotificacao> {
    return await prismaClient.notificacao.update({
      where: { id },
      data: {
        lida: true,
      },
    });
  }

  async marcarTodasComoLidas(usuarioId: string): Promise<number> {
    const result = await prismaClient.notificacao.updateMany({
      where: {
        usuarioId,
        lida: false,
      },
      data: {
        lida: true,
      },
    });
    return result.count;
  }

  async contarNotificacoesNaoLidas(usuarioId: string): Promise<number> {
    return await prismaClient.notificacao.count({
      where: {
        usuarioId,
        lida: false,
      },
    });
  }

  async deletarNotificacao(id: string): Promise<void> {
    await prismaClient.notificacao.delete({
      where: { id },
    });
  }

  async deletarNotificacoesAntigas(diasAntigos: number = 30): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAntigos);

    const result = await prismaClient.notificacao.deleteMany({
      where: {
        enviadaEm: {
          lt: dataLimite,
        },
        lida: true,
      },
    });
    return result.count;
  }

  async criarNotificacaoEmLote(notificacoes: ICriarNotificacao[]): Promise<number> {
    const result = await prismaClient.notificacao.createMany({
      data: notificacoes.map(notif => ({
        usuarioId: notif.usuarioId,
        mensagem: notif.mensagem,
        tipo: notif.tipo || TipoNotificacao.GERAL,
        lida: false,
      })),
    });
    return result.count;
  }

  async listarNotificacoesPorEmpresa(empresaId: string): Promise<INotificacaoComUsuario[]> {
    return await prismaClient.notificacao.findMany({
      where: {
        usuario: {
          empresaId: empresaId,
        },
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
          },
        },
      },
      orderBy: {
        enviadaEm: 'desc',
      },
    });
  }

  // Métodos específicos para o sistema de notificações baseado em faturas e contratos

  async buscarFaturasVencidas(): Promise<any[]> {
    const hoje = new Date();
    return await prismaClient.fatura.findMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: {
          lt: hoje
        }
      },
      include: {
        contrato: {
          include: {
            inquilino: true,
            loja: true
          }
        }
      }
    });
  }

  async buscarFaturasProximoVencimento(dataLimite: Date): Promise<any[]> {
    const hoje = new Date();
    return await prismaClient.fatura.findMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: {
          gte: hoje,
          lte: dataLimite
        }
      },
      include: {
        contrato: {
          include: {
            inquilino: true,
            loja: true
          }
        }
      }
    });
  }

  async buscarContratosProximoVencimento(dataLimite: Date): Promise<any[]> {
    const hoje = new Date();
    return await prismaClient.contrato.findMany({
      where: {
        status: 'ATIVO',
        dataFim: {
          gte: hoje,
          lte: dataLimite
        }
      },
      include: {
        inquilino: true,
        loja: true
      }
    });
  }

  async buscarFaturaPorId(faturaId: string): Promise<any | null> {
    return await prismaClient.fatura.findUnique({
      where: { id: faturaId },
      include: {
        contrato: {
          include: {
            inquilino: true,
            loja: true
          }
        }
      }
    });
  }

  async verificarNotificacaoExistente(usuarioId: string, tipo: TipoNotificacao, referencia: string): Promise<boolean> {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const notificacao = await prismaClient.notificacao.findFirst({
      where: {
        usuarioId,
        tipo,
        mensagem: {
          contains: referencia.includes('fatura-') ? 
            referencia.replace('fatura-', '').replace('fatura-proximo-', '') : 
            referencia.replace('contrato-', '')
        },
        enviadaEm: {
          gte: inicioHoje
        }
      }
    });

    return !!notificacao;
  }
}