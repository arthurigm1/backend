import prismaClient from "../../prisma/PrismaClient";
import { StatusFatura, StatusContrato } from "../../generated/prisma";

export interface IGerarFaturasMensais {
  mesReferencia: number;
  anoReferencia: number;
}

export interface IFaturaGerada {
  id: string;
  contratoId: string;
  valorAluguel: number;
  dataVencimento: Date;
  mesReferencia: number;
  anoReferencia: number;
}

export class FaturaService {
  
  /**
   * Gera faturas mensais para todos os contratos ativos
   * @param data - Mês e ano de referência para geração das faturas
   * @returns Array de faturas geradas
   */
  async gerarFaturasMensais(data: IGerarFaturasMensais): Promise<IFaturaGerada[]> {
    const { mesReferencia, anoReferencia } = data;
    
    // Buscar todos os contratos ativos que estão dentro do período
    const contratosAtivos = await prismaClient.contrato.findMany({
      where: {
        status: StatusContrato.ATIVO,
        ativo: true,
        dataInicio: {
          lte: new Date(anoReferencia, mesReferencia - 1, 1) // Início do mês de referência
        },
        dataFim: {
          gte: new Date(anoReferencia, mesReferencia - 1, 1) // Início do mês de referência
        }
      },
      include: {
        loja: true,
        inquilino: true
      }
    });

    const faturasGeradas: IFaturaGerada[] = [];

    for (const contrato of contratosAtivos) {
      // Verificar se já existe fatura para este contrato no mês/ano
      const faturaExistente = await prismaClient.fatura.findFirst({
        where: {
          contratoId: contrato.id,
          mesReferencia,
          anoReferencia
        }
      });

      if (faturaExistente) {
        console.log(`Fatura já existe para contrato ${contrato.id} - ${mesReferencia}/${anoReferencia}`);
        continue;
      }

      // Calcular valor com reajuste se aplicável
      const valorFinal = this.calcularValorComReajuste(contrato, anoReferencia);
      
      // Data de vencimento usando o dia especificado no contrato
      const dataVencimento = new Date(anoReferencia, mesReferencia, contrato.dataVencimento);

      // Criar a fatura
      const novaFatura = await prismaClient.fatura.create({
        data: {
          contratoId: contrato.id,
          mesReferencia,
          anoReferencia,
          valorAluguel: valorFinal,
          dataVencimento,
          status: StatusFatura.PENDENTE
        }
      });

      faturasGeradas.push({
        id: novaFatura.id,
        contratoId: novaFatura.contratoId,
        valorAluguel: novaFatura.valorAluguel,
        dataVencimento: novaFatura.dataVencimento,
        mesReferencia: novaFatura.mesReferencia,
        anoReferencia: novaFatura.anoReferencia
      });
    }

    return faturasGeradas;
  }

  /**
   * Calcula o valor do aluguel com reajuste anual se aplicável
   */
  private calcularValorComReajuste(contrato: any, anoReferencia: number): number {
    if (!contrato.reajusteAnual || !contrato.percentualReajuste) {
      return contrato.valorAluguel;
    }

    const anoInicioContrato = new Date(contrato.dataInicio).getFullYear();
    const anosDecorridos = anoReferencia - anoInicioContrato;
    
    if (anosDecorridos <= 0) {
      return contrato.valorAluguel;
    }

    // Aplicar reajuste composto
    const fatorReajuste = Math.pow(1 + (contrato.percentualReajuste / 100), anosDecorridos);
    return contrato.valorAluguel * fatorReajuste;
  }

  /**
   * Gera um número único para a fatura
   */
  private async gerarNumeroFatura(contratoId: string, mes: number, ano: number): Promise<string> {
    const prefixo = `${ano}${mes.toString().padStart(2, '0')}`;
    const sufixo = contratoId.substring(0, 8).toUpperCase();
    return `FAT-${prefixo}-${sufixo}`;
  }

  /**
   * Lista faturas com filtros e paginação
   */
  async listarFaturas(filtros: {
    contratoId?: string;
    mesReferencia?: number;
    anoReferencia?: number;
    status?: StatusFatura;
    page?: number;
    limit?: number;
  }) {
    const { contratoId, mesReferencia, anoReferencia, status, page = 1, limit = 10 } = filtros;
    
    const where: any = {};
    
    if (contratoId) where.contratoId = contratoId;
    if (mesReferencia) where.mesReferencia = mesReferencia;
    if (anoReferencia) where.anoReferencia = anoReferencia;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [faturas, total] = await Promise.all([
      prismaClient.fatura.findMany({
        where,
        include: {
          contrato: {
            include: {
              loja: true,
              inquilino: true
            }
          },
          pagamentos: true
        },
        orderBy: [
          { anoReferencia: 'desc' },
          { mesReferencia: 'desc' }
        ],
        skip,
        take: limit
      }),
      prismaClient.fatura.count({ where })
    ]);

    return {
      faturas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Atualiza status da fatura
   */
  async atualizarStatusFatura(faturaId: string, novoStatus: StatusFatura) {
    return await prismaClient.fatura.update({
      where: { id: faturaId },
      data: { status: novoStatus }
    });
  }

  /**
   * Busca fatura por ID
   */
  async buscarFaturaPorId(faturaId: string) {
    return await prismaClient.fatura.findUnique({
      where: { id: faturaId },
      include: {
        contrato: {
          include: {
            loja: true,
            inquilino: true
          }
        },
        pagamentos: true
      }
    });
  }
}