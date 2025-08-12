import { NotificacaoService } from "../Notificacao/NotificacaoService";

export class SchedulerService {
  private notificacaoService: NotificacaoService;
  private intervalos: NodeJS.Timeout[] = [];

  constructor() {
    this.notificacaoService = new NotificacaoService();
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
        ? 'Próxima execução em até 6 horas' 
        : 'Agendamento não ativo',
    };
  }
}