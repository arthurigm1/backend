import { 
  ICriarContrato, 
  IContrato, 
  IAtualizarContrato, 
  IFiltrosContrato, 
  IContratoComRelacoes,
  IListarContratosResponse 
} from "../../interface/Contrato/Contrato";
import { PrismaClient, StatusContrato, StatusFatura } from "../../generated/prisma";

const prismaClient = new PrismaClient();

export class ContratoModel {
  async criarContrato(dados: ICriarContrato): Promise<IContrato> {
    const contrato = await prismaClient.contrato.create({
      data: {
        lojaId: dados.lojaId,
        inquilinoId: dados.inquilinoId,
        valorAluguel: dados.valorAluguel,
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim,
        dataVencimento: dados.dataVencimento,
        reajusteAnual: dados.reajusteAnual || false,
        percentualReajuste: dados.percentualReajuste,
        clausulas: dados.clausulas,
        observacoes: dados.observacoes,
      },
    });

    // Criar fatura para o próximo mês
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    
    // Data de vencimento baseada no dia especificado no contrato
    const dataVencimentoFatura = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), dados.dataVencimento);

    await prismaClient.fatura.create({
      data: {
        contratoId: contrato.id,
        mesReferencia: proximoMes.getMonth() + 1,
        anoReferencia: proximoMes.getFullYear(),
        valorAluguel: dados.valorAluguel,
        dataVencimento: dataVencimentoFatura,
        status: StatusFatura.PENDENTE,
      }
    });

    return contrato;
  }

  async buscarPorId(id: string): Promise<IContratoComRelacoes | null> {
    return await prismaClient.contrato.findUnique({
      where: { id },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            numero: true,
            localizacao: true,
          },
        },
        inquilino: {
          select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            telefone: true,
          },
        },
      },
    });
  }

  async listarContratos(
    filtros: IFiltrosContrato = {},
    page?: number,
    limit?: number
  ): Promise<IContratoComRelacoes[] | IListarContratosResponse> {
    const where: any = {};

    // Aplicar filtros
    if (filtros.status) {
      where.status = filtros.status;
    }
    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }
    if (filtros.lojaId) {
      where.lojaId = filtros.lojaId;
    }
    if (filtros.inquilinoId) {
      where.inquilinoId = filtros.inquilinoId;
    }
    if (filtros.dataInicioMin || filtros.dataInicioMax) {
      where.dataInicio = {};
      if (filtros.dataInicioMin) {
        where.dataInicio.gte = filtros.dataInicioMin;
      }
      if (filtros.dataInicioMax) {
        where.dataInicio.lte = filtros.dataInicioMax;
      }
    }
    if (filtros.dataFimMin || filtros.dataFimMax) {
      where.dataFim = {};
      if (filtros.dataFimMin) {
        where.dataFim.gte = filtros.dataFimMin;
      }
      if (filtros.dataFimMax) {
        where.dataFim.lte = filtros.dataFimMax;
      }
    }

    const include = {
      loja: {
        select: {
          id: true,
          nome: true,
          numero: true,
          localizacao: true,
        },
      },
      inquilino: {
        select: {
          id: true,
          nome: true,
          email: true,
          cpf: true,
          telefone: true,
        },
      },
    };

    // Se não há paginação, retorna todos os contratos
    if (!page || !limit) {
      return await prismaClient.contrato.findMany({
        where,
        include,
        orderBy: {
          criadoEm: 'desc',
        },
      });
    }

    // Com paginação
    const skip = (page - 1) * limit;
    const take = limit;

    const [contratos, totalContratos] = await Promise.all([
      prismaClient.contrato.findMany({
        where,
        include,
        skip,
        take,
        orderBy: {
          criadoEm: 'desc',
        },
      }),
      prismaClient.contrato.count({ where }),
    ]);

    const totalPaginas = Math.ceil(totalContratos / limit);

    return {
      contratos,
      totalContratos,
      totalPaginas,
    };
  }

  async listarContratosPorEmpresa(
    empresaId: string,
    filtros: IFiltrosContrato = {},
    page?: number,
    limit?: number
  ): Promise<IContratoComRelacoes[] | IListarContratosResponse> {
    const where: any = {
      loja: {
        empresaId: empresaId,
      },
    };

    // Aplicar filtros adicionais
    if (filtros.status) {
      where.status = filtros.status;
    }
    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }
    if (filtros.lojaId) {
      where.lojaId = filtros.lojaId;
    }
    if (filtros.inquilinoId) {
      where.inquilinoId = filtros.inquilinoId;
    }

    const include = {
      loja: {
        select: {
          id: true,
          nome: true,
          numero: true,
          localizacao: true,
        },
      },
      inquilino: {
        select: {
          id: true,
          nome: true,
          email: true,
          cpf: true,
          telefone: true,
        },
      },
    };

    // Se não há paginação, retorna todos os contratos
    if (!page || !limit) {
      return await prismaClient.contrato.findMany({
        where,
        include,
        orderBy: {
          criadoEm: 'desc',
        },
      });
    }

    // Com paginação
    const skip = (page - 1) * limit;
    const take = limit;

    const [contratos, totalContratos] = await Promise.all([
      prismaClient.contrato.findMany({
        where,
        include,
        skip,
        take,
        orderBy: {
          criadoEm: 'desc',
        },
      }),
      prismaClient.contrato.count({ where }),
    ]);

    const totalPaginas = Math.ceil(totalContratos / limit);

    return {
      contratos,
      totalContratos,
      totalPaginas,
    };
  }

  async atualizarContrato(id: string, dados: IAtualizarContrato): Promise<IContrato> {
    return await prismaClient.contrato.update({
      where: { id },
      data: dados,
    });
  }

  async deletarContrato(id: string): Promise<void> {
    await prismaClient.contrato.delete({
      where: { id },
    });
  }

  async verificarSeContratoPerteceEmpresa(contratoId: string, empresaId: string): Promise<boolean> {
    const contrato = await prismaClient.contrato.findFirst({
      where: {
        id: contratoId,
        loja: {
          empresaId: empresaId,
        },
      },
    });
    return !!contrato;
  }

  async buscarContratosVencendoEm(dias: number): Promise<IContratoComRelacoes[]> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);

    return await prismaClient.contrato.findMany({
      where: {
        dataFim: {
          lte: dataLimite,
        },
        status: StatusContrato.ATIVO,
        ativo: true,
      },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            numero: true,
            localizacao: true,
          },
        },
        inquilino: {
          select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            telefone: true,
          },
        },
      },
    });
  }

  async buscarContratosVencidos(): Promise<IContratoComRelacoes[]> {
    const hoje = new Date();

    return await prismaClient.contrato.findMany({
      where: {
        dataFim: {
          lt: hoje,
        },
        status: StatusContrato.ATIVO,
        ativo: true,
      },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            numero: true,
            localizacao: true,
          },
        },
        inquilino: {
          select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            telefone: true,
          },
        },
      },
    });
  }

  async atualizarStatusContratosVencidos(): Promise<number> {
    const hoje = new Date();

    const resultado = await prismaClient.contrato.updateMany({
      where: {
        dataFim: {
          lt: hoje,
        },
        status: StatusContrato.ATIVO,
      },
      data: {
        status: StatusContrato.VENCIDO,
      },
    });

    return resultado.count;
  }

  async buscarUsuariosEmpresaPorContrato(contratoId: string): Promise<any[]> {
    const contrato = await prismaClient.contrato.findUnique({
      where: { id: contratoId },
      include: {
        loja: {
          include: {
            empresa: {
              include: {
                usuarios: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,
                    tipo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return contrato?.loja.empresa.usuarios || [];
  }
}