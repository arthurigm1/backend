import { 
  ICriarContrato, 
  IContrato, 
  IAtualizarContrato, 
  IFiltrosContrato, 
  IContratoComRelacoes,
  IListarContratosResponse 
} from "../../interface/Contrato/Contrato";
import { PrismaClient, StatusContrato, StatusFatura } from "../../generated/prisma";
import { EFIService } from "../../services/EFIService";
import { 
  IEFIOneStepCharge, 
  IEFICustomer, 
  IEFICustomerAddress 
} from "../../interface/EFI/EFI";

const prismaClient = new PrismaClient();

export class ContratoModel {
  private efiService: EFIService;

  constructor() {
    this.efiService = new EFIService();
  }
  async criarContrato(dados: ICriarContrato): Promise<IContrato> {
    // Primeiro, buscar dados necessários para criar a cobrança EFI
    const loja = await prismaClient.loja.findUnique({
      where: { id: dados.lojaId }
    });

    const inquilino = await prismaClient.usuario.findUnique({
      where: { id: dados.inquilinoId }
    });

    if (!loja) {
      throw new Error("Loja não encontrada");
    }

    if (!inquilino) {
      throw new Error("Inquilino não encontrado");
    }

    // Preparar dados para a fatura
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    
    // Data de vencimento baseada no dia especificado no contrato
    const dataVencimentoFatura = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), dados.dataVencimento);

    // Preparar dados do cliente para EFI
    const customerAddress: IEFICustomerAddress = {
      street: "Rua Exemplo", // Você pode buscar do perfil do inquilino ou usar padrão
      number: "123",
      neighborhood: "Centro",
      zipcode: "35400000",
      city: "Ouro Preto",
      state: "MG"
    };

    const customer: IEFICustomer = {
      name: inquilino.nome,
      cpf: inquilino.cpf || "54568878004",
      email: inquilino.email,
      phone_number: inquilino.telefone || "31999999999",
      address: customerAddress
    };

    // Preparar cobrança one-step
    const oneStepCharge: IEFIOneStepCharge = {
      items: [
        {
          name: `Aluguel ${loja.nome} - ${proximoMes.getMonth() + 1}/${proximoMes.getFullYear()}`,
          value: Math.round(dados.valorAluguel * 100), // Converter para centavos
          amount: 1
        }
      ],
      payment: {
        banking_billet: {
          customer,
          expire_at: dataVencimentoFatura.toISOString().split('T')[0], // Formato YYYY-MM-DD
          configurations: {
            fine: 200, // 2% de multa (em centavos)
            interest: 33 // 0.33% de juros ao dia (em centavos)
          },
          message: `Aluguel referente ao mês ${proximoMes.getMonth() + 1}/${proximoMes.getFullYear()}\nLoja: ${loja.nome}\nInquilino: ${inquilino.nome}`
        }
      }
    };

    // Tentar criar a cobrança EFI primeiro
    const cobrancaEFI = await this.efiService.criarCobrancaOneStep(oneStepCharge);

    if (!cobrancaEFI || !cobrancaEFI.data) {
      throw new Error("Falha ao criar cobrança EFI. Contrato não foi criado.");
    }

    // Se a cobrança EFI foi criada com sucesso, criar contrato e fatura em transação
    return await prismaClient.$transaction(async (tx) => {
      // Criar contrato
      const contrato = await tx.contrato.create({
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
      const novaFatura = await tx.fatura.create({
        data: {
          contratoId: contrato.id,
          mesReferencia: proximoMes.getMonth() + 1,
          anoReferencia: proximoMes.getFullYear(),
          valorAluguel: dados.valorAluguel,
          dataVencimento: dataVencimentoFatura,
          status: StatusFatura.PENDENTE,
        }
      });

      // Criar registro na tabela EFICobranca
      const efiCobranca = await tx.eFICobranca.create({
        data: {
          chargeId: cobrancaEFI.data.charge_id,
          barcode: cobrancaEFI.data.barcode,
          pixQrcode: cobrancaEFI.data.pix.qrcode,
          pixQrcodeImage: cobrancaEFI.data.pix.qrcode_image,
          link: cobrancaEFI.data.link,
          billetLink: cobrancaEFI.data.billet_link,
          pdfLink: cobrancaEFI.data.pdf.charge,
          expireAt: new Date(cobrancaEFI.data.expire_at),
          status: cobrancaEFI.data.status,
          total: cobrancaEFI.data.total,
          payment: cobrancaEFI.data.payment
        }
      });

      // Atualizar a fatura com o ID da EFICobranca
      await tx.fatura.update({
        where: { id: novaFatura.id },
        data: { efiCobrancaId: efiCobranca.id }
      });

      console.log(`Contrato, fatura e cobrança EFI criados com sucesso. Contrato: ${contrato.id}, Fatura: ${novaFatura.id}, Cobrança EFI: ${cobrancaEFI.data.charge_id}`);

      return contrato;
    });
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