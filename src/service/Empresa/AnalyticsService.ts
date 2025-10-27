import prismaClient from "../../prisma/PrismaClient";
import { StatusFatura } from "../../generated/prisma";

export interface PeriodoFiltro {
  inicio?: Date;
  fim?: Date;
}

export class AnalyticsService {
  async gerarAnalyticsEmpresa(empresaId: string, periodo: PeriodoFiltro = {}) {
    const hoje = new Date();
    const inicio = periodo.inicio;
    const fim = periodo.fim;

    // Buscar faturas associadas à empresa via relação contrato -> loja -> empresa
    const faturas = await prismaClient.fatura.findMany({
      where: {
        contrato: {
          loja: { empresaId }
        }
      },
      include: {
        contrato: {
          include: {
            loja: true,
            inquilino: { select: { id: true, nome: true } }
          }
        }
      }
    });

    // Totais por status
    const porStatus = {
      pendentes: faturas.filter(f => f.status === StatusFatura.PENDENTE),
      pagas: faturas.filter(f => f.status === StatusFatura.PAGA),
      vencidas: faturas.filter(f => f.status === StatusFatura.VENCIDA),
      canceladas: faturas.filter(f => f.status === StatusFatura.CANCELADA)
    };

    const somaValor = (lista: typeof faturas) => lista.reduce((acc, f) => acc + (f.valorAluguel || 0), 0);

    // Inadimplência
    const emAtraso = faturas.filter(f =>
      (f.status === StatusFatura.PENDENTE || f.status === StatusFatura.VENCIDA) &&
      f.dataVencimento < hoje
    );

    const valorTotalEmAtraso = somaValor(emAtraso);

    // Agrupar inadimplência por inquilino
    const mapaInadimplentes = new Map<string, { inquilinoId: string; nome: string; totalEmAtraso: number; quantidadeFaturas: number }>();
    for (const f of emAtraso) {
      const key = f.contrato.inquilino.id;
      const atual = mapaInadimplentes.get(key) || { inquilinoId: key, nome: f.contrato.inquilino.nome, totalEmAtraso: 0, quantidadeFaturas: 0 };
      atual.totalEmAtraso += f.valorAluguel || 0;
      atual.quantidadeFaturas += 1;
      mapaInadimplentes.set(key, atual);
    }
    const topInadimplentes = Array.from(mapaInadimplentes.values())
      .sort((a, b) => b.totalEmAtraso - a.totalEmAtraso)
      .slice(0, 5);

    // Séries: recebimentos por mês (considera data de atualização como proxy de pagamento) e a receber por mês
    const formatMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const recebimentosPorMesMap = new Map<string, number>();
    for (const f of porStatus.pagas) {
      const d = f.atualizadoEm || f.dataVencimento;
      const chave = formatMes(d);
      recebimentosPorMesMap.set(chave, (recebimentosPorMesMap.get(chave) || 0) + (f.valorAluguel || 0));
    }
    const recebimentosPorMes = Array.from(recebimentosPorMesMap.entries())
      .map(([mes, valor]) => ({ mes, valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    const aReceberPorMesMap = new Map<string, number>();
    for (const f of porStatus.pendentes) {
      const chave = formatMes(f.dataVencimento);
      aReceberPorMesMap.set(chave, (aReceberPorMesMap.get(chave) || 0) + (f.valorAluguel || 0));
    }
    const aReceberPorMes = Array.from(aReceberPorMesMap.entries())
      .map(([mes, valor]) => ({ mes, valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    // Controle de caixa no período
    const dentroPeriodo = (d?: Date) => {
      if (!d) return false;
      if (inicio && d < inicio) return false;
      if (fim && d > fim) return false;
      return true;
    };

    const entradasPeriodo = porStatus.pagas
      .filter(f => dentroPeriodo(f.atualizadoEm || f.dataVencimento))
      .reduce((acc, f) => acc + (f.valorAluguel || 0), 0);

    const aReceberPeriodo = faturas
      .filter(f => (f.status === StatusFatura.PENDENTE || f.status === StatusFatura.VENCIDA) && dentroPeriodo(f.dataVencimento))
      .reduce((acc, f) => acc + (f.valorAluguel || 0), 0);

    return {
      totals: {
        faturas: {
          pendentes: { quantidade: porStatus.pendentes.length, valor: somaValor(porStatus.pendentes) },
          pagas: { quantidade: porStatus.pagas.length, valor: somaValor(porStatus.pagas) },
          vencidas: { quantidade: porStatus.vencidas.length, valor: somaValor(porStatus.vencidas) },
          canceladas: { quantidade: porStatus.canceladas.length, valor: somaValor(porStatus.canceladas) },
        },
      },
      inadimplencia: {
        totalInadimplentes: mapaInadimplentes.size,
        valorTotalEmAtraso,
        topInadimplentes,
      },
      caixa: {
        periodo: {
          inicio: inicio?.toISOString(),
          fim: fim?.toISOString(),
        },
        entradas: entradasPeriodo,
        aReceber: aReceberPeriodo,
      },
      series: {
        recebimentosPorMes,
        aReceberPorMes,
      },
    };
  }
}