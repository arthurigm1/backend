import { ICriarEmpresa, IEmpresa } from "../../interface/Empresa/Empresa";
import { PrismaClient } from "../../generated/prisma";

const prismaClient = new PrismaClient();

export class EmpresaModel {
  async criarEmpresa(empresa: ICriarEmpresa) {
    return await prismaClient.empresa.create({
      data: {
        nome: empresa.nome,
        cnpj: empresa.cnpj,
      },
    });
  }

  async buscarPorCnpj(cnpj: string) {
    return await prismaClient.empresa.findUnique({
      where: { cnpj },
    });
  }

  async buscarPorId(id: string) {
    return await prismaClient.empresa.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            criadoEm: true,
          },
        },
      },
    });
  }

  async listarEmpresas() {
    return await prismaClient.empresa.findMany({
      select: {
        id: true,
        nome: true,
        cnpj: true,
        criadoEm: true,
        _count: {
          select: {
            usuarios: true,
          },
        },
      },
    });
  }
}