import prismaClient from "../../prisma/PrismaClient";
import { StatusFatura, StatusContrato } from "../../generated/prisma";
import { EFIService } from "../../services/EFIService";
import { 
  IEFIOneStepCharge, 
  IEFICustomer, 
  IEFICustomerAddress 
} from "../../interface/EFI/EFI";


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
  private efiService: EFIService;

  constructor() {
    this.efiService = new EFIService();
  }
  
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
        dataInicio: {
          lte: new Date(anoReferencia, mesReferencia - 1, 1) // Início do mês de referência
        },
        dataFim: {
          gte: new Date(anoReferencia, mesReferencia - 1, 1) // Início do mês de referência
        }
      },
      include: {
        loja: true,
        inquilino: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            cpf: true
          }
        }
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

      // Criar cobrança EFI one-step para a fatura
      try {
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
          name: contrato.inquilino.nome,
          cpf: contrato.inquilino.cpf || "12345678910",
          email: contrato.inquilino.email,
          phone_number: contrato.inquilino.telefone || "31999999999",
          address: customerAddress
        };

        // Preparar cobrança one-step
        const oneStepCharge: IEFIOneStepCharge = {
          items: [
            {
              name: `Aluguel ${contrato.loja.nome} - ${mesReferencia}/${anoReferencia}`,
              value: Math.round(valorFinal * 100), // Converter para centavos
              amount: 1
            }
          ],
          payment: {
            banking_billet: {
              customer,
              expire_at: dataVencimento.toISOString().split('T')[0], // Formato YYYY-MM-DD
              configurations: {
                fine: 200, // 2% de multa (em centavos)
                interest: 33 // 0.33% de juros ao dia (em centavos)
              },
              message: `Aluguel referente ao mês ${mesReferencia}/${anoReferencia}\nLoja: ${contrato.loja.nome}\nInquilino: ${contrato.inquilino.nome}\nContrato: ${contrato.id}`
            }
          }
        };

        const cobrancaEFI = await this.efiService.criarCobrancaOneStep(oneStepCharge);

        if (cobrancaEFI && cobrancaEFI.data) {
          // Criar registro na tabela EFICobranca
          const efiCobranca = await prismaClient.eFICobranca.create({
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

          // Atualizar fatura com o ID da EFICobranca
          await prismaClient.fatura.update({
            where: { id: novaFatura.id },
            data: {
              efiCobrancaId: efiCobranca.id
            }
          });

          console.log(`Cobrança EFI one-step criada para fatura ${novaFatura.id}: ${cobrancaEFI.data.charge_id}`);
        }
      } catch (error) {
        console.error(`Erro ao criar cobrança EFI one-step para fatura ${novaFatura.id}:`, error);
        throw Error("ERRO COBRANCA")
      }

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
        select: {
          id: true,
          mesReferencia: true,
          anoReferencia: true,
          valorAluguel: true,
          dataVencimento: true,
          status: true,
          contrato: {
            select: {
              loja: {
                select: {
                  nome: true,
                  numero: true,
                }
              },
              inquilino: {
                select: {
                  nome: true,
                }
              }
            }
          }
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

    // Formatar os dados para uma estrutura mais limpa
    const faturasFormatadas = faturas.map(fatura => {
      const hoje = new Date();
      const estaVencida = fatura.dataVencimento < hoje && fatura.status !== StatusFatura.PAGA;
      
      return {
        id: fatura.id,
        referencia: `${String(fatura.mesReferencia).padStart(2, '0')}/${fatura.anoReferencia}`,
        valor: fatura.valorAluguel,
        valorFormatado: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(fatura.valorAluguel),
        dataVencimento: fatura.dataVencimento,
        status: fatura.status,
        statusDescricao: this.obterDescricaoStatus(fatura.status),
        estaVencida,
        loja: `${fatura.contrato.loja.nome} - ${fatura.contrato.loja.numero}`,
        inquilino: fatura.contrato.inquilino.nome,
      };
    });

    return {
      faturas: faturasFormatadas,
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
            inquilino: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpf: true,
              }
            }
          }
        }
      }
    });
  }

  /**
   * Busca detalhes completos da fatura com informações relevantes
   */
  async buscarDetalhesCompletos(faturaId: string) {
    const fatura = await prismaClient.fatura.findUnique({
      where: { id: faturaId },
      select: {
        id: true,
        mesReferencia: true,
        anoReferencia: true,
        valorAluguel: true,
        dataVencimento: true,
        status: true,
        contrato: {
          select: {
            valorAluguel: true,
            dataInicio: true,
            dataFim: true,
            status: true,
            loja: {
              select: {
                nome: true,
                numero: true,
                localizacao: true,
                empresa: {
                  select: {
                    nome: true,
                  }
                }
              }
            },
            inquilino: {
              select: {
                nome: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!fatura) {
      return null;
    }

    // Calcular informações essenciais
    const hoje = new Date();
    const diasParaVencimento = Math.ceil((fatura.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    const diasEmAtraso = diasParaVencimento < 0 ? Math.abs(diasParaVencimento) : 0;
    const estaVencida = fatura.dataVencimento < hoje && fatura.status !== StatusFatura.PAGA;

    return {
      fatura: {
        id: fatura.id,
        referencia: `${String(fatura.mesReferencia).padStart(2, '0')}/${fatura.anoReferencia}`,
        valor: fatura.valorAluguel,
        valorFormatado: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(fatura.valorAluguel),
        dataVencimento: fatura.dataVencimento,
        status: fatura.status,
        statusDescricao: this.obterDescricaoStatus(fatura.status),
        estaVencida,
        diasParaVencimento: diasParaVencimento > 0 ? diasParaVencimento : null,
        diasEmAtraso: estaVencida ? diasEmAtraso : null,
      },
      loja: {
        nome: fatura.contrato.loja.nome,
        numero: fatura.contrato.loja.numero,
        localizacao: fatura.contrato.loja.localizacao,
        empresa: fatura.contrato.loja.empresa.nome,
      },
      inquilino: {
        nome: fatura.contrato.inquilino.nome,
        email: fatura.contrato.inquilino.email,
      },
      contrato: {
        valorAluguel: fatura.contrato.valorAluguel,
        dataInicio: fatura.contrato.dataInicio,
        dataFim: fatura.contrato.dataFim,
        status: fatura.contrato.status,
      }
    };
  }

  /**
   * Obtém descrição amigável do status da fatura
   */
  private obterDescricaoStatus(status: StatusFatura): string {
    const descricoes = {
      [StatusFatura.PENDENTE]: 'Aguardando pagamento',
      [StatusFatura.PAGA]: 'Paga',
      [StatusFatura.VENCIDA]: 'Vencida',
      [StatusFatura.CANCELADA]: 'Cancelada'
    };
    return descricoes[status] || status;
  }
}