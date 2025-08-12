import { NotificacaoModel } from "../../models/Notificacao/NotificacaoModel";
import { PagamentoModel } from "../../models/Pagamento/PagamentoModel";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { ICriarNotificacao, INotificacao, IFiltroNotificacoes } from "../../interface/Notificacao/Notificacao";
import { TipoNotificacao } from "../../generated/prisma";
import { ApiError } from "../../utils/apiError";

export class NotificacaoService {
  private notificacaoModel: NotificacaoModel;
  private pagamentoModel: PagamentoModel;
  private usuarioModel: UsuarioModel;

  constructor() {
    this.notificacaoModel = new NotificacaoModel();
    this.pagamentoModel = new PagamentoModel();
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

  // Método principal para processar notificações de inadimplência
  async processarNotificacoesInadimplencia(): Promise<{
    pagamentosVencidos: number;
    pagamentosProximoVencimento: number;
    notificacoesEnviadas: number;
  }> {
    // Atualizar status dos pagamentos vencidos
    const pagamentosAtualizados = await this.pagamentoModel.atualizarStatusPagamentosVencidos();

    // Buscar pagamentos vencidos
    const pagamentosVencidos = await this.pagamentoModel.listarPagamentosVencidos();
    
    // Buscar pagamentos próximos ao vencimento (7 dias)
    const pagamentosProximoVencimento = await this.pagamentoModel.listarPagamentosProximosVencimento(7);

    const notificacoesParaCriar: ICriarNotificacao[] = [];

    // Criar notificações para pagamentos vencidos
    for (const pagamento of pagamentosVencidos) {
      const diasAtraso = Math.floor((new Date().getTime() - pagamento.dataVenc.getTime()) / (1000 * 60 * 60 * 24));
      
      const mensagem = `Pagamento em atraso há ${diasAtraso} dia(s). Loja: ${pagamento.contrato.loja.nome} (${pagamento.contrato.loja.numero}). Valor: R$ ${pagamento.valor.toFixed(2)}. Vencimento: ${pagamento.dataVenc.toLocaleDateString('pt-BR')}.`;
      
      notificacoesParaCriar.push({
        usuarioId: pagamento.usuarioId,
        mensagem,
        tipo: TipoNotificacao.PAGAMENTO_VENCIDO,
      });
    }

    // Criar notificações para pagamentos próximos ao vencimento
    for (const pagamento of pagamentosProximoVencimento) {
      const diasRestantes = Math.ceil((pagamento.dataVenc.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      const mensagem = `Pagamento vence em ${diasRestantes} dia(s). Loja: ${pagamento.contrato.loja.nome} (${pagamento.contrato.loja.numero}). Valor: R$ ${pagamento.valor.toFixed(2)}. Vencimento: ${pagamento.dataVenc.toLocaleDateString('pt-BR')}.`;
      
      notificacoesParaCriar.push({
        usuarioId: pagamento.usuarioId,
        mensagem,
        tipo: TipoNotificacao.PAGAMENTO_PROXIMO_VENCIMENTO,
      });
    }

    // Criar todas as notificações em lote
    const notificacoesEnviadas = notificacoesParaCriar.length > 0 
      ? await this.notificacaoModel.criarNotificacaoEmLote(notificacoesParaCriar)
      : 0;

    return {
      pagamentosVencidos: pagamentosVencidos.length,
      pagamentosProximoVencimento: pagamentosProximoVencimento.length,
      notificacoesEnviadas,
    };
  }

  async notificarPagamentoRealizado(pagamentoId: string): Promise<void> {
    const pagamento = await this.pagamentoModel.buscarPorIdComDetalhes(pagamentoId);
    if (!pagamento) {
      throw new ApiError(404, "Pagamento não encontrado");
    }

    const mensagem = `Pagamento confirmado! Loja: ${pagamento.contrato.loja.nome} (${pagamento.contrato.loja.numero}). Valor: R$ ${pagamento.valor.toFixed(2)}. Data: ${new Date().toLocaleDateString('pt-BR')}.`;
    
    await this.notificacaoModel.criarNotificacao({
      usuarioId: pagamento.usuarioId,
      mensagem,
      tipo: TipoNotificacao.PAGAMENTO_REALIZADO,
    });
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
    
    const [notificacoesTotal, notificacoesMes, pagamentosVencidos, pagamentosProximoVencimento] = await Promise.all([
      this.notificacaoModel.listarNotificacoesPorEmpresa(empresaId),
      this.notificacaoModel.listarNotificacoesComFiltro({
        dataInicio: inicioMes,
        dataFim: hoje,
      }),
      this.pagamentoModel.listarPagamentosVencidos(),
      this.pagamentoModel.listarPagamentosProximosVencimento(7),
    ]);

    return {
      totalNotificacoes: notificacoesTotal.length,
      notificacoesMesAtual: notificacoesMes.length,
      pagamentosVencidos: pagamentosVencidos.length,
      pagamentosProximoVencimento: pagamentosProximoVencimento.length,
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