import { NotificacaoService } from "../Notificacao/NotificacaoService";
import { ContratoService } from "../Contrato/ContratoService";
import { FaturaService } from "../Fatura/FaturaService";

export class SchedulerService {
  private notificacaoService: NotificacaoService;
  private contratoService: ContratoService;
  private faturaService: FaturaService;
  private intervalos: NodeJS.Timeout[] = [];

  constructor() {
    this.notificacaoService = new NotificacaoService();
    this.contratoService = new ContratoService();
    this.faturaService = new FaturaService();
  }

  // Iniciar o agendamento automático de notificações
  iniciarAgendamentoNotificacoes(): void {
    console.log('Iniciando agendamento automático de notificações de inadimplência...');
    
    // Processar notificações a cada 6 horas (6 * 60 * 60 * 1000 ms)
    const intervaloNotificacoes = setInterval(async () => {
      try {
        console.log('Processando notificações de inadimplência automaticamente...');
        const resultado = await this.notificacaoService.processarNotificacoesInadimplencia();
        console.log('Processamento concluído:', resultado);
      } catch (error) {
        console.error('Erro ao processar notificações automaticamente:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 horas

    this.intervalos.push(intervaloNotificacoes);

    // Verificar contratos vencendo e atualizar status a cada 12 horas
    const intervaloContratos = setInterval(async () => {
      try {
        console.log('Verificando contratos vencendo e atualizando status...');
        await this.processarContratosVencimento();
        console.log('Verificação de contratos concluída');
      } catch (error) {
        console.error('Erro ao processar contratos:', error);
      }
    }, 12 * 60 * 60 * 1000); // 12 horas

    this.intervalos.push(intervaloContratos);

    // Limpar notificações antigas a cada 24 horas
    const intervaloLimpeza = setInterval(async () => {
      try {
        console.log('Limpando notificações antigas...');
        const quantidade = await this.notificacaoService.limparNotificacoesAntigas();
        console.log(`${quantidade} notificações antigas removidas`);
      } catch (error) {
        console.error('Erro ao limpar notificações antigas:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas

    this.intervalos.push(intervaloLimpeza);

    // Gerar faturas mensais automaticamente no dia 1 de cada mês
    const intervaloFaturas = setInterval(async () => {
      try {
        const agora = new Date();
        const diaAtual = agora.getDate();
        
        // Executar apenas no dia 1 do mês
        if (diaAtual === 1) {
          console.log('Gerando faturas mensais automaticamente...');
          const mesReferencia = agora.getMonth() + 1; // getMonth() retorna 0-11
          const anoReferencia = agora.getFullYear();
          
          const faturasGeradas = await this.faturaService.gerarFaturasMensais({
            mesReferencia,
            anoReferencia
          });
          
          console.log(`${faturasGeradas.length} faturas geradas para ${mesReferencia}/${anoReferencia}`);
        }
      } catch (error) {
        console.error('Erro ao gerar faturas mensais automaticamente:', error);
      }
    }, 24 * 60 * 60 * 1000); // Verificar diariamente

    this.intervalos.push(intervaloFaturas);

    // Executar processamento inicial após 30 segundos
    setTimeout(async () => {
      try {
        console.log('Executando processamento inicial de notificações...');
        const resultado = await this.notificacaoService.processarNotificacoesInadimplencia();
        console.log('Processamento inicial concluído:', resultado);
        
        // Também executar verificação inicial de contratos
        console.log('Executando verificação inicial de contratos...');
        await this.processarContratosVencimento();
        console.log('Verificação inicial de contratos concluída');
      } catch (error) {
        console.error('Erro no processamento inicial:', error);
      }
    }, 30000); // 30 segundos
  }

  // Parar todos os agendamentos
  pararAgendamentos(): void {
    console.log('Parando agendamentos automáticos...');
    this.intervalos.forEach(intervalo => {
      clearInterval(intervalo);
    });
    this.intervalos = [];
  }

  // Processar notificações manualmente
  async processarNotificacoesManual(): Promise<any> {
    try {
      console.log('Processando notificações manualmente...');
      const resultado = await this.notificacaoService.processarNotificacoesInadimplencia();
      console.log('Processamento manual concluído:', resultado);
      return resultado;
    } catch (error) {
      console.error('Erro no processamento manual:', error);
      throw error;
    }
  }

  // Processar contratos vencendo e atualizar status
  private async processarContratosVencimento(): Promise<void> {
    try {
      // Atualizar status de contratos vencidos
      const contratosAtualizados = await this.contratoService.atualizarStatusContratosVencidos();
      console.log(`${contratosAtualizados} contratos tiveram status atualizado para VENCIDO`);
      
      // Buscar contratos vencendo em 30 dias para alertas
      const contratosVencendo30 = await this.contratoService.buscarContratosVencendoEm(30);
      if (contratosVencendo30.length > 0) {
        console.log(`${contratosVencendo30.length} contratos vencendo em 30 dias`);
        await this.enviarNotificacoesVencimentoContrato(contratosVencendo30, 30);
      }
      
      // Buscar contratos vencendo em 7 dias para alertas urgentes
      const contratosVencendo7 = await this.contratoService.buscarContratosVencendoEm(7);
      if (contratosVencendo7.length > 0) {
        console.log(`${contratosVencendo7.length} contratos vencendo em 7 dias (URGENTE)`);
        await this.enviarNotificacoesVencimentoContrato(contratosVencendo7, 7);
      }
      
      // Buscar contratos vencendo hoje para alertas críticos
      const contratosVencendoHoje = await this.contratoService.buscarContratosVencendoEm(0);
      if (contratosVencendoHoje.length > 0) {
        console.log(`${contratosVencendoHoje.length} contratos vencendo HOJE (CRÍTICO)`);
        await this.enviarNotificacoesVencimentoContrato(contratosVencendoHoje, 0);
      }
    } catch (error) {
      console.error('Erro ao processar contratos vencimento:', error);
      throw error;
    }
  }

  // Processar contratos manualmente
  async processarContratosManual(): Promise<any> {
    try {
      console.log('Processando contratos manualmente...');
      await this.processarContratosVencimento();
      console.log('Processamento manual de contratos concluído');
      return { success: true, message: 'Contratos processados com sucesso' };
    } catch (error) {
      console.error('Erro no processamento manual de contratos:', error);
      throw error;
    }
  }

  // Enviar notificações de vencimento de contratos
  private async enviarNotificacoesVencimentoContrato(contratos: any[], diasParaVencimento: number): Promise<void> {
    try {
      for (const contrato of contratos) {
        let mensagem: string;
        let prioridade: string;
        
        if (diasParaVencimento === 0) {
          mensagem = `🚨 CRÍTICO: Contrato vence HOJE! Loja: ${contrato.loja.nome} (${contrato.loja.numero}). Inquilino: ${contrato.inquilino.nome}. Valor: R$ ${contrato.valorAluguel.toFixed(2)}. Vencimento: ${contrato.dataFim.toLocaleDateString('pt-BR')}.`;
          prioridade = 'CRÍTICO';
        } else if (diasParaVencimento <= 7) {
          mensagem = `⚠️ URGENTE: Contrato vence em ${diasParaVencimento} dia(s). Loja: ${contrato.loja.nome} (${contrato.loja.numero}). Inquilino: ${contrato.inquilino.nome}. Valor: R$ ${contrato.valorAluguel.toFixed(2)}. Vencimento: ${contrato.dataFim.toLocaleDateString('pt-BR')}.`;
          prioridade = 'URGENTE';
        } else {
          mensagem = `📅 Contrato vence em ${diasParaVencimento} dias. Loja: ${contrato.loja.nome} (${contrato.loja.numero}). Inquilino: ${contrato.inquilino.nome}. Valor: R$ ${contrato.valorAluguel.toFixed(2)}. Vencimento: ${contrato.dataFim.toLocaleDateString('pt-BR')}.`;
          prioridade = 'NORMAL';
        }

        // Enviar notificação para o inquilino
        await this.notificacaoService.criarNotificacao({
          usuarioId: contrato.inquilinoId,
          mensagem: mensagem,
          tipo: 'CONTRATO_VENCIMENTO'
        }, 'SISTEMA');

        // Buscar usuários da empresa (ADMIN_EMPRESA e FUNCIONARIO) para notificar
        const usuariosEmpresa = await this.contratoService.buscarUsuariosEmpresaPorContrato(contrato.id);
        for (const usuario of usuariosEmpresa) {
          if (usuario.tipo === 'ADMIN_EMPRESA' || usuario.tipo === 'FUNCIONARIO') {
            await this.notificacaoService.criarNotificacao({
              usuarioId: usuario.id,
              mensagem: mensagem,
              tipo: 'CONTRATO_VENCIMENTO'
            }, 'SISTEMA');
          }
        }

        console.log(`Notificação de vencimento enviada para contrato ${contrato.id} (${prioridade})`);
      }
    } catch (error) {
      console.error('Erro ao enviar notificações de vencimento de contrato:', error);
      throw error;
    }
  }

  // Gerar faturas mensais manualmente
  async gerarFaturasMensaisManual(mesReferencia: number, anoReferencia: number): Promise<any> {
    try {
      console.log(`Gerando faturas mensais manualmente para ${mesReferencia}/${anoReferencia}...`);
      
      const faturasGeradas = await this.faturaService.gerarFaturasMensais({
        mesReferencia,
        anoReferencia
      });
      
      const resultado = {
        sucesso: true,
        faturasGeradas: faturasGeradas.length,
        faturas: faturasGeradas,
        mesReferencia,
        anoReferencia,
        dataProcessamento: new Date()
      };
      
      console.log(`Geração manual concluída: ${faturasGeradas.length} faturas geradas`);
      return resultado;
    } catch (error) {
      console.error('Erro ao gerar faturas mensais manualmente:', error);
      throw error;
    }
  }

  // Obter status dos agendamentos
  obterStatusAgendamentos(): {
    ativo: boolean;
    quantidadeIntervalos: number;
    proximaExecucao: string;
  } {
    return {
      ativo: this.intervalos.length > 0,
      quantidadeIntervalos: this.intervalos.length,
      proximaExecucao: this.intervalos.length > 0 
        ? 'Próxima execução em até 6 horas (notificações) e 12 horas (contratos)' 
        : 'Agendamento não ativo',
    };
  }
}