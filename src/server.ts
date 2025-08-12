import dotenv from "dotenv";
import app from "./app";
import { SchedulerService } from "./service/Scheduler/SchedulerService";

dotenv.config();

const port: number = parseInt(`${process.env.PORT} || 3010`);
const schedulerService = new SchedulerService();

app.listen(3010, () => {
  console.log("Servidor Rodando na porta 3010");
  console.log("Inicializando sistema de notificações...");
  
  // Iniciar o agendamento automático de notificações
  schedulerService.iniciarAgendamentoNotificacoes();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, parando agendamentos...');
  schedulerService.pararAgendamentos();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recebido SIGINT, parando agendamentos...');
  schedulerService.pararAgendamentos();
  process.exit(0);
});
