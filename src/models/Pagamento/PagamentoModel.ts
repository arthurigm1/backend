
import { ICriarPagamento, IPagamento, IAtualizarPagamento, IPagamentoComDetalhes } from "../../interface/Pagamento/Pagamento";
import { PrismaClient } from "../../generated/prisma";

const prismaClient = new PrismaClient();

export class PagamentoModel {
  async criarPagamento(data: ICriarPagamento): Promise<IPagamento> {
    return await prismaClient.pagamento.create({
      data: {
        contratoId: data.contratoId,
        usuarioId: data.usuarioId,
        valor: data.valor,
        dataVenc: data.dataVenc,
        status: data.status || 'PENDENTE',
      },
    });
  }

  async buscarPorId(id: string): Promise<IPagamento | null> {
    return await prismaClient.pagamento.findUnique({
      where: { id },
    });
  }

  async buscarPorIdComDetalhes(id: string): Promise<IPagamentoComDetalhes | null> {
    return await prismaClient.pagamento.findUnique({
      where: { id },
      include: {
        contrato: {
          select: {
            id: true,
            valorAluguel: true,
            loja: {
              select: {
                nome: true,
                numero: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  }

  async listarPagamentosPorUsuario(usuarioId: string): Promise<IPagamentoComDetalhes[]> {
    return await prismaClient.pagamento.findMany({
      where: { usuarioId },
      include: {
        contrato: {
          select: {
            id: true,
            valorAluguel: true,
            loja: {
              select: {
                nome: true,
                numero: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        dataVenc: 'desc',
      },
    });
  }

  async listarPagamentosPorContrato(contratoId: string): Promise<IPagamentoComDetalhes[]> {
    return await prismaClient.pagamento.findMany({
      where: { contratoId },
      include: {
        contrato: {
          select: {
            id: true,
            valorAluguel: true,
            loja: {
              select: {
                nome: true,
                numero: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        dataVenc: 'desc',
      },
    });
  }

  async listarPagamentosVencidos(): Promise<IPagamentoComDetalhes[]> {
    const hoje = new Date();
    return await prismaClient.pagamento.findMany({
      where: {
        dataVenc: {
          lt: hoje,
        },
        status: {
          in: ['PENDENTE', 'ATRASADO'],
        },
      },
      include: {
        contrato: {
          select: {
            id: true,
            valorAluguel: true,
            loja: {
              select: {
                nome: true,
                numero: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        dataVenc: 'asc',
      },
    });
  }

  async listarPagamentosProximosVencimento(diasAntecedencia: number = 7): Promise<IPagamentoComDetalhes[]> {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + diasAntecedencia);

    return await prismaClient.pagamento.findMany({
      where: {
        dataVenc: {
          gte: hoje,
          lte: dataLimite,
        },
        status: 'PENDENTE',
      },
      include: {
        contrato: {
          select: {
            id: true,
            valorAluguel: true,
            loja: {
              select: {
                nome: true,
                numero: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        dataVenc: 'asc',
      },
    });
  }

  async atualizarPagamento(id: string, data: IAtualizarPagamento): Promise<IPagamento> {
    return await prismaClient.pagamento.update({
      where: { id },
      data,
    });
  }

  async marcarComoPago(id: string): Promise<IPagamento> {
    return await prismaClient.pagamento.update({
      where: { id },
      data: {
        status: 'PAGO',
        dataPag: new Date(),
      },
    });
  }

  async marcarComoAtrasado(id: string): Promise<IPagamento> {
    return await prismaClient.pagamento.update({
      where: { id },
      data: {
        status: 'ATRASADO',
      },
    });
  }

  async atualizarStatusPagamentosVencidos(): Promise<number> {
    const hoje = new Date();
    const result = await prismaClient.pagamento.updateMany({
      where: {
        dataVenc: {
          lt: hoje,
        },
        status: 'PENDENTE',
      },
      data: {
        status: 'ATRASADO',
      },
    });
    return result.count;
  }

  async listarPagamentosPorEmpresa(empresaId: string): Promise<IPagamentoComDetalhes[]> {
    return await prismaClient.pagamento.findMany({
      where: {
        contrato: {
          loja: {
            empresaId: empresaId,
          },
        },
      },
      include: {
        contrato: {
          select: {
            id: true,
            valorAluguel: true,
            loja: {
              select: {
                nome: true,
                numero: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        dataVenc: 'desc',
      },
    });
  }
}