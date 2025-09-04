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

  async verificarSeLojaPerteceEmpresa(lojaId: string, empresaId: string) {
    const loja = await prismaClient.loja.findFirst({
      where: {
        id: lojaId,
        empresaId: empresaId,
      },
    });
    return !!loja;
  }

  async editarLoja(id: string, dados: any) {
    const updateData: any = {};

    // Campos básicos da loja
    if (dados.nome !== undefined) updateData.nome = dados.nome;
    if (dados.numero !== undefined) updateData.numero = dados.numero;
    if (dados.localizacao !== undefined) updateData.localizacao = dados.localizacao;
    if (dados.status !== undefined) updateData.status = dados.status;



    // Se está vinculando inquilino
    if (dados.vincularInquilino) {
      updateData.usuarioId = dados.vincularInquilino.inquilinoId;
      updateData.status = 'OCUPADA';
    }

    // Atualizar loja
    return await prismaClient.loja.update({
      where: { id },
      data: updateData,
      include: {
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

  async desvincularInquilino(id: string) {
    return await prismaClient.loja.update({
      where: { id },
      data: {
        usuarioId: null,
        status: 'VAGA',
      },
      include: {
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
}