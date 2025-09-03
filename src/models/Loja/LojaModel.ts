import { ICriarLoja, ILoja, IVincularInquilino } from "../../interface/Loja/Loja";
import { PrismaClient } from "../../generated/prisma";

const prismaClient = new PrismaClient();

export class LojaModel {
  async criarLoja(dados: ICriarLoja): Promise<ILoja> {
    const loja = await prismaClient.loja.create({
      data: {
        nome: dados.nome,
        numero: dados.numero,
        localizacao: dados.localizacao,
        status: dados.status,
        empresaId: dados.empresaId,
      },
    });
    return loja;
  }

  async buscarPorId(id: string) {
    return await prismaClient.loja.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        contratos: {
          include: {
            inquilino: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async listarLojasDaEmpresa(empresaId: string, page?: number, limit?: number) {
    // Se não há paginação, retorna todas as lojas
    if (!page || !limit) {
      return await prismaClient.loja.findMany({
        where: { empresaId },
        include: {
          contratos: {
            where: { ativo: true },
            include: {
              inquilino: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          numero: 'asc',
        },
      });
    }

    // Calcular skip e take para paginação
    const skip = (page - 1) * limit;
    const take = limit;

    // Buscar lojas com paginação
    const lojas = await prismaClient.loja.findMany({
      where: { empresaId },
      include: {
        contratos: {
          where: { ativo: true },
          include: {
            inquilino: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        numero: 'asc',
      },
      skip,
      take,
    });

    // Contar total de lojas
    const totalLojas = await prismaClient.loja.count({
      where: { empresaId },
    });

    // Calcular total de páginas
    const totalPaginas = Math.ceil(totalLojas / limit);

    return {
      lojas,
      totalLojas,
      totalPaginas,
    };
  }

  async buscarPorNumero(numero: string, empresaId: string) {
    return await prismaClient.loja.findFirst({
      where: {
        numero,
        empresaId,
      },
    });
  }

  async atualizarStatus(id: string, status: 'VAGA' | 'OCUPADA' | 'INATIVA') {
    return await prismaClient.loja.update({
      where: { id },
      data: { status },
    });
  }

  async vincularInquilino(dados: IVincularInquilino) {
    // Criar contrato e atualizar status da loja para OCUPADA
    const resultado = await prismaClient.$transaction(async (prisma) => {
      // Criar o contrato
      const contrato = await prisma.contrato.create({
        data: {
          lojaId: dados.lojaId,
          inquilinoId: dados.inquilinoId,
          valorAluguel: dados.valorAluguel,
          dataInicio: dados.dataInicio,
          dataFim: dados.dataFim || new Date(),
          reajusteAnual: dados.reajusteAnual,
          ativo: true,
        },
      });

      // Atualizar status da loja para OCUPADA
      await prisma.loja.update({
        where: { id: dados.lojaId },
        data: { status: 'OCUPADA' },
      });

      return contrato;
    });

    return resultado;
  }

  async verificarSeLojaPerteceEmpresa(lojaId: string, empresaId: string) {
    const loja = await prismaClient.loja.findFirst({
      where: {
        id: lojaId,
        empresaId: empresaId,
      },
    });
    return !!loja;
  }
}