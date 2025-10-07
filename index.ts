import dotenv from "dotenv";
import app from "./src/app";
import { SchedulerService } from "./src/service/Scheduler/SchedulerService";

dotenv.config();

const port: number = parseInt(process.env.PORT || "3010");
const schedulerService = new SchedulerService();

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor Rodando na porta ${port}`);
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
