import { PagamentoModel } from "../../models/Pagamento/PagamentoModel";
import { UsuarioModel } from "../../models/Usuario/UsuarioModel";
import { NotificacaoService } from "../Notificacao/NotificacaoService";
import { ICriarPagamento, IPagamento, IAtualizarPagamento } from "../../interface/Pagamento/Pagamento";
import { ApiError } from "../../utils/apiError";

export class PagamentoService {
  private pagamentoModel: PagamentoModel;
  private usuarioModel: UsuarioModel;
  private notificacaoService: NotificacaoService;

  constructor() {
    this.pagamentoModel = new PagamentoModel();
    this.usuarioModel = new UsuarioModel();
    this.notificacaoService = new NotificacaoService();
  }

  async criarPagamento(data: ICriarPagamento, usuarioSolicitante: string): Promise<IPagamento> {
    // Verificar se o usuário solicitante tem permissão (deve ser admin da empresa)
    const usuarioSolic = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuarioSolic) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    if (usuarioSolic.tipo !== 'ADMIN_EMPRESA' && usuarioSolic.tipo !== 'FUNCIONARIO') {
      throw new ApiError(403, "Sem permissão para criar pagamentos");
    }

    // Verificar se o usuário do pagamento existe
    const usuario = await this.usuarioModel.buscarPorId(data.usuarioId);
    if (!usuario) {
      throw new ApiError(404, "Usuário do pagamento não encontrado");
    }

    // Verificar se o usuário pertence à mesma empresa
    if (usuario.empresaId !== usuarioSolic.empresaId) {
      throw new ApiError(403, "Usuário não pertence à sua empresa");
    }

    return await this.pagamentoModel.criarPagamento(data);
  }

  async buscarPagamentoPorId(id: string, usuarioSolicitante: string) {
    const pagamento = await this.pagamentoModel.buscarPorIdComDetalhes(id);
    if (!pagamento) {
      throw new ApiError(404, "Pagamento não encontrado");
    }

    const usuarioSolic = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuarioSolic) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    // Verificar permissões: próprio usuário ou admin/funcionário da empresa
    if (pagamento.usuarioId !== usuarioSolicitante) {
      const usuarioPagamento = await this.usuarioModel.buscarPorId(pagamento.usuarioId);
      if (!usuarioPagamento || usuarioPagamento.empresaId !== usuarioSolic.empresaId) {
        throw new ApiError(403, "Sem permissão para ver este pagamento");
      }
      
      if (usuarioSolic.tipo === 'INQUILINO') {
        throw new ApiError(403, "Sem permissão para ver pagamentos de outros usuários");
      }
    }

    return pagamento;
  }

  async listarPagamentosPorUsuario(usuarioId: string, usuarioSolicitante: string) {
    // Verificar se pode ver os pagamentos (próprios ou se é admin/funcionário da empresa)
    if (usuarioId !== usuarioSolicitante) {
      const usuarioSolic = await this.usuarioModel.buscarPorId(usuarioSolicitante);
      const usuarioAlvo = await this.usuarioModel.buscarPorId(usuarioId);
      
      if (!usuarioSolic || !usuarioAlvo) {
        throw new ApiError(404, "Usuário não encontrado");
      }

      if (usuarioSolic.empresaId !== usuarioAlvo.empresaId || usuarioSolic.tipo === 'INQUILINO') {
        throw new ApiError(403, "Sem permissão para ver pagamentos deste usuário");
      }
    }

    return await this.pagamentoModel.listarPagamentosPorUsuario(usuarioId);
  }

  async listarPagamentosPorEmpresa(empresaId: string, usuarioSolicitante: string) {
    const usuario = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuario) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    if (usuario.empresaId !== empresaId || usuario.tipo === 'INQUILINO') {
      throw new ApiError(403, "Sem permissão para ver pagamentos desta empresa");
    }

    return await this.pagamentoModel.listarPagamentosPorEmpresa(empresaId);
  }

  async listarPagamentosVencidos(usuarioSolicitante: string) {
    const usuario = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuario) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    if (usuario.tipo === 'INQUILINO') {
      // Inquilino só pode ver seus próprios pagamentos vencidos
      const todosPagamentosVencidos = await this.pagamentoModel.listarPagamentosVencidos();
      return todosPagamentosVencidos.filter(p => p.usuarioId === usuarioSolicitante);
    }

    // Admin e funcionário podem ver todos os pagamentos vencidos da empresa
    const todosPagamentosVencidos = await this.pagamentoModel.listarPagamentosVencidos();
    return todosPagamentosVencidos.filter(p => {
      // Filtrar apenas pagamentos de usuários da mesma empresa
      return p.usuario && p.usuario.id; // Assumindo que a consulta inclui dados do usuário
    });
  }

  async marcarComoPago(id: string, usuarioSolicitante: string): Promise<IPagamento> {
    const pagamento = await this.pagamentoModel.buscarPorId(id);
    if (!pagamento) {
      throw new ApiError(404, "Pagamento não encontrado");
    }

    const usuarioSolic = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuarioSolic) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    // Verificar permissões
    if (usuarioSolic.tipo === 'INQUILINO' && pagamento.usuarioId !== usuarioSolicitante) {
      throw new ApiError(403, "Sem permissão para marcar este pagamento como pago");
    }

    if (usuarioSolic.tipo !== 'INQUILINO') {
      // Admin/funcionário deve verificar se o pagamento é da mesma empresa
      const usuarioPagamento = await this.usuarioModel.buscarPorId(pagamento.usuarioId);
      if (!usuarioPagamento || usuarioPagamento.empresaId !== usuarioSolic.empresaId) {
        throw new ApiError(403, "Sem permissão para marcar este pagamento como pago");
      }
    }

    const pagamentoAtualizado = await this.pagamentoModel.marcarComoPago(id);
    
    // Enviar notificação de pagamento realizado
    try {
      await this.notificacaoService.notificarPagamentoRealizado(id);
    } catch (error) {
      console.error('Erro ao enviar notificação de pagamento realizado:', error);
      // Não falhar a operação principal por causa da notificação
    }

    return pagamentoAtualizado;
  }

  async atualizarPagamento(id: string, data: IAtualizarPagamento, usuarioSolicitante: string): Promise<IPagamento> {
    const pagamento = await this.pagamentoModel.buscarPorId(id);
    if (!pagamento) {
      throw new ApiError(404, "Pagamento não encontrado");
    }

    const usuarioSolic = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuarioSolic) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    // Apenas admin e funcionário podem atualizar pagamentos
    if (usuarioSolic.tipo === 'INQUILINO') {
      throw new ApiError(403, "Sem permissão para atualizar pagamentos");
    }

    // Verificar se o pagamento é da mesma empresa
    const usuarioPagamento = await this.usuarioModel.buscarPorId(pagamento.usuarioId);
    if (!usuarioPagamento || usuarioPagamento.empresaId !== usuarioSolic.empresaId) {
      throw new ApiError(403, "Sem permissão para atualizar este pagamento");
    }

    return await this.pagamentoModel.atualizarPagamento(id, data);
  }

  async obterEstatisticasPagamentos(empresaId: string, usuarioSolicitante: string) {
    const usuario = await this.usuarioModel.buscarPorId(usuarioSolicitante);
    if (!usuario) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    if (usuario.empresaId !== empresaId || usuario.tipo === 'INQUILINO') {
      throw new ApiError(403, "Sem permissão para ver estatísticas desta empresa");
    }

    const [todosPagamentos, pagamentosVencidos, pagamentosProximoVencimento] = await Promise.all([
      this.pagamentoModel.listarPagamentosPorEmpresa(empresaId),
      this.pagamentoModel.listarPagamentosVencidos(),
      this.pagamentoModel.listarPagamentosProximosVencimento(7),
    ]);

    // Filtrar apenas pagamentos da empresa
    const pagamentosVencidosEmpresa = pagamentosVencidos.filter(p => 
      p.contrato && p.contrato.loja && p.contrato.loja.nome
    );
    
    const pagamentosProximoVencimentoEmpresa = pagamentosProximoVencimento.filter(p => 
      p.contrato && p.contrato.loja && p.contrato.loja.nome
    );

    const totalRecebido = todosPagamentos
      .filter(p => p.status === 'PAGO')
      .reduce((sum, p) => sum + p.valor, 0);

    const totalPendente = todosPagamentos
      .filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO')
      .reduce((sum, p) => sum + p.valor, 0);

    return {
      totalPagamentos: todosPagamentos.length,
      pagamentosPagos: todosPagamentos.filter(p => p.status === 'PAGO').length,
      pagamentosPendentes: todosPagamentos.filter(p => p.status === 'PENDENTE').length,
      pagamentosAtrasados: todosPagamentos.filter(p => p.status === 'ATRASADO').length,
      pagamentosVencidos: pagamentosVencidosEmpresa.length,
      pagamentosProximoVencimento: pagamentosProximoVencimentoEmpresa.length,
      valorTotalRecebido: totalRecebido,
      valorTotalPendente: totalPendente,
    };
  }
}