import { NotificacaoModel } from "../../models/Notificacao/NotificacaoModel";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { ICriarNotificacao, INotificacao, IFiltroNotificacoes } from "../../interface/Notificacao/Notificacao";
import { TipoNotificacao } from "../../generated/prisma";
import { ApiError } from "../../utils/apiError";

export class NotificacaoService {
  private notificacaoModel: NotificacaoModel;
  private usuarioModel: UsuarioModel;

  constructor() {
    this.notificacaoModel = new NotificacaoModel();
    this.usuarioModel = new UsuarioModel();
  }

  async criarNotificacao(data: ICriarNotificacao, usuarioSolicitante: string): Promise<INotificacao> {
    // Verificar se o usuário existe
    const usuario = await this.usuarioModel.buscarPorId(data.usuarioId);
    if (!usuario) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    // Verificar se o usuário solicitante tem permissão (deve ser da mesma empresa ou admin)
    const usuarioSolic = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuarioSolic) {
      throw new ApiError(404, "Usuário solicitante não encontrado");
    }

    if (usuarioSolic.empresaId !== usuario.empresaId && usuarioSolic.tipo !== 'ADMIN_EMPRESA') {
      throw new ApiError(403, "Sem permissão para criar notificação para este usuário");
    }

    return await this.notificacaoModel.criarNotificacao(data);
  }

  async listarNotificacoesPorUsuario(usuarioId: string, usuarioSolicitante: string, limite?: number): Promise<INotificacao[]> {
    // Verificar se o usuário pode ver as notificações (próprias ou se é admin da empresa)
    if (usuarioId !== usuarioSolicitante) {
      const usuarioSolic = await this.usuarioModel.buscarPorId(usuarioSolicitante);
      const usuarioAlvo = await this.usuarioModel.buscarPorId(usuarioId);
      
      if (!usuarioSolic || !usuarioAlvo) {
        throw new ApiError(404, "Usuário não encontrado");
      }

      if (usuarioSolic.empresaId !== usuarioAlvo.empresaId || usuarioSolic.tipo === 'INQUILINO') {
        throw new ApiError(403, "Sem permissão para ver notificações deste usuário");
      }
    }

    return await this.notificacaoModel.listarNotificacoesPorUsuario(usuarioId, limite);
  }

  async listarNotificacoesNaoLidas(usuarioId: string): Promise<INotificacao[]> {
    return await this.notificacaoModel.listarNotificacoesNaoLidas(usuarioId);
  }

  async marcarComoLida(notificacaoId: string, usuarioId: string): Promise<INotificacao> {
    const notificacao = await this.notificacaoModel.buscarPorId(notificacaoId);
    if (!notificacao) {
      throw new ApiError(404, "Notificação não encontrada");
    }

    if (notificacao.usuarioId !== usuarioId) {
      throw new ApiError(403, "Sem permissão para marcar esta notificação como lida");
    }

    return await this.notificacaoModel.marcarComoLida(notificacaoId);
  }

  async marcarTodasComoLidas(usuarioId: string): Promise<number> {
    return await this.notificacaoModel.marcarTodasComoLidas(usuarioId);
  }

  async contarNotificacoesNaoLidas(usuarioId: string): Promise<number> {
    return await this.notificacaoModel.contarNotificacoesNaoLidas(usuarioId);
  }

  // Método principal para processar notificações de inadimplência baseado em faturas
  async processarNotificacoesInadimplencia(): Promise<{
    faturasVencidas: number;
    faturasProximoVencimento: number;
    contratosProximoVencimento: number;
    notificacoesEnviadas: number;
  }> {
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(hoje.getDate() + 7);
    
    const em30Dias = new Date();
    em30Dias.setDate(hoje.getDate() + 30);

    let notificacoesEnviadas = 0;

    try {
      // 1. Buscar faturas vencidas (status PENDENTE e data de vencimento passou)
      const faturasVencidas = await this.notificacaoModel.buscarFaturasVencidas();
      
      // 2. Buscar faturas próximas ao vencimento (próximos 7 dias)
      const faturasProximoVencimento = await this.notificacaoModel.buscarFaturasProximoVencimento(em7Dias);
      
      // 3. Buscar contratos próximos ao vencimento (próximos 30 dias)
      const contratosProximoVencimento = await this.notificacaoModel.buscarContratosProximoVencimento(em30Dias);

      // 4. Processar notificações para faturas vencidas
      for (const fatura of faturasVencidas) {
        const jaNotificado = await this.notificacaoModel.verificarNotificacaoExistente(
          fatura.contrato.inquilinoId,
          TipoNotificacao.PAGAMENTO_VENCIDO,
          `fatura-${fatura.id}`
        );

        if (!jaNotificado) {
          await this.notificacaoModel.criarNotificacao({
            usuarioId: fatura.contrato.inquilinoId,
            mensagem: `Sua fatura referente ao mês ${fatura.mesReferencia}/${fatura.anoReferencia} da loja ${fatura.contrato.loja.nome} está vencida. Valor: R$ ${fatura.valorAluguel.toFixed(2)}`,
            tipo: TipoNotificacao.PAGAMENTO_VENCIDO
          });
          notificacoesEnviadas++;
        }
      }

      // 5. Processar notificações para faturas próximas ao vencimento
      for (const fatura of faturasProximoVencimento) {
        const jaNotificado = await this.notificacaoModel.verificarNotificacaoExistente(
          fatura.contrato.inquilinoId,
          TipoNotificacao.PAGAMENTO_PROXIMO_VENCIMENTO,
          `fatura-proximo-${fatura.id}`
        );

        if (!jaNotificado) {
          const diasParaVencimento = Math.ceil((fatura.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          await this.notificacaoModel.criarNotificacao({
            usuarioId: fatura.contrato.inquilinoId,
            mensagem: `Sua fatura referente ao mês ${fatura.mesReferencia}/${fatura.anoReferencia} da loja ${fatura.contrato.loja.nome} vence em ${diasParaVencimento} dias. Valor: R$ ${fatura.valorAluguel.toFixed(2)}`,
            tipo: TipoNotificacao.PAGAMENTO_PROXIMO_VENCIMENTO
          });
          notificacoesEnviadas++;
        }
      }

      // 6. Processar notificações para contratos próximos ao vencimento
      for (const contrato of contratosProximoVencimento) {
        const jaNotificado = await this.notificacaoModel.verificarNotificacaoExistente(
          contrato.inquilinoId,
          TipoNotificacao.CONTRATO_VENCIMENTO,
          `contrato-${contrato.id}`
        );

        if (!jaNotificado) {
          const diasParaVencimento = Math.ceil((contrato.dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          await this.notificacaoModel.criarNotificacao({
            usuarioId: contrato.inquilinoId,
            mensagem: `Seu contrato da loja ${contrato.loja.nome} vence em ${diasParaVencimento} dias. Entre em contato para renovação.`,
            tipo: TipoNotificacao.CONTRATO_VENCIMENTO
          });
          notificacoesEnviadas++;
        }
      }

      return {
        faturasVencidas: faturasVencidas.length,
        faturasProximoVencimento: faturasProximoVencimento.length,
        contratosProximoVencimento: contratosProximoVencimento.length,
        notificacoesEnviadas,
      };

    } catch (error) {
      console.error('Erro ao processar notificações de inadimplência:', error);
      throw new ApiError(500, "Erro interno ao processar notificações");
    }
  }

  // Notificar quando uma fatura for paga
  async notificarFaturaPaga(faturaId: string): Promise<void> {
    try {
      const fatura = await this.notificacaoModel.buscarFaturaPorId(faturaId);
      if (!fatura) {
        throw new ApiError(404, "Fatura não encontrada");
      }

      await this.notificacaoModel.criarNotificacao({
        usuarioId: fatura.contrato.inquilinoId,
        mensagem: `Pagamento confirmado! Sua fatura referente ao mês ${fatura.mesReferencia}/${fatura.anoReferencia} da loja ${fatura.contrato.loja.nome} foi quitada.`,
        tipo: TipoNotificacao.PAGAMENTO_REALIZADO
      });

    } catch (error) {
      console.error('Erro ao notificar pagamento realizado:', error);
      throw error;
    }
  }

  async listarNotificacoesPorEmpresa(empresaId: string, usuarioSolicitante: string, filtro?: IFiltroNotificacoes) {
    // Verificar se o usuário tem permissão (deve ser admin da empresa)
    const usuario = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuario) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    if (usuario.empresaId !== empresaId || usuario.tipo === 'INQUILINO') {
      throw new ApiError(403, "Sem permissão para ver notificações desta empresa");
    }

    if (filtro) {
      return await this.notificacaoModel.listarNotificacoesComFiltro(filtro);
    }

    return await this.notificacaoModel.listarNotificacoesPorEmpresa(empresaId);
  }

  async obterEstatisticasNotificacoes(empresaId: string, usuarioSolicitante: string) {
    // Verificar permissões
    const usuario = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuario) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    if (usuario.empresaId !== empresaId || usuario.tipo === 'INQUILINO') {
      throw new ApiError(403, "Sem permissão para ver estatísticas desta empresa");
    }

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const [notificacoesTotal, notificacoesMes, faturasVencidas, faturasProximoVencimento, contratosProximoVencimento] = await Promise.all([
      this.notificacaoModel.listarNotificacoesPorEmpresa(empresaId),
      this.notificacaoModel.listarNotificacoesComFiltro({
        dataInicio: inicioMes,
        dataFim: hoje,
      }),
      this.notificacaoModel.buscarFaturasVencidas(),
      this.notificacaoModel.buscarFaturasProximoVencimento(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      this.notificacaoModel.buscarContratosProximoVencimento(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    ]);

    // Filtrar faturas e contratos da empresa específica
    const faturasVencidasEmpresa = faturasVencidas.filter(f => f.contrato.inquilino.empresaId === empresaId);
    const faturasProximoVencimentoEmpresa = faturasProximoVencimento.filter(f => f.contrato.inquilino.empresaId === empresaId);
    const contratosProximoVencimentoEmpresa = contratosProximoVencimento.filter(c => c.inquilino.empresaId === empresaId);

    return {
      totalNotificacoes: notificacoesTotal.length,
      notificacoesMesAtual: notificacoesMes.length,
      faturasVencidas: faturasVencidasEmpresa.length,
      faturasProximoVencimento: faturasProximoVencimentoEmpresa.length,
      contratosProximoVencimento: contratosProximoVencimentoEmpresa.length,
      notificacoesPorTipo: {
        pagamentoVencido: notificacoesTotal.filter(n => n.tipo === TipoNotificacao.PAGAMENTO_VENCIDO).length,
        pagamentoProximoVencimento: notificacoesTotal.filter(n => n.tipo === TipoNotificacao.PAGAMENTO_PROXIMO_VENCIMENTO).length,
        pagamentoRealizado: notificacoesTotal.filter(n => n.tipo === TipoNotificacao.PAGAMENTO_REALIZADO).length,
        contratoVencimento: notificacoesTotal.filter(n => n.tipo === TipoNotificacao.CONTRATO_VENCIMENTO).length,
        geral: notificacoesTotal.filter(n => n.tipo === TipoNotificacao.GERAL).length,
      },
    };
  }

  async limparNotificacoesAntigas(): Promise<number> {
    return await this.notificacaoModel.deletarNotificacoesAntigas(30);
  }
}