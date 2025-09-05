import { NotificacaoService } from "../Notificacao/NotificacaoService";
import { ContratoService } from "../Contrato/ContratoService";

export class SchedulerService {
  private notificacaoService: NotificacaoService;
  private contratoService: ContratoService;
  private intervalos: NodeJS.Timeout[] = [];

  constructor() {
    this.notificacaoService = new NotificacaoService();
    this.contratoService = new ContratoService();
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
        // Aqui você pode implementar lógica para enviar notificações
      }
      
      // Buscar contratos vencendo em 7 dias para alertas urgentes
      const contratosVencendo7 = await this.contratoService.buscarContratosVencendoEm(7);
      if (contratosVencendo7.length > 0) {
        console.log(`${contratosVencendo7.length} contratos vencendo em 7 dias (URGENTE)`);
        // Aqui você pode implementar lógica para enviar notificações urgentes
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