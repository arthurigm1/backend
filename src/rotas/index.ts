// src/rotas/index.ts
import { Router } from "express";
import usuarioRoutes from "./usuario/usuario";
import empresaRoutes from "./empresa/empresa";
import lojaRoutes from "./loja/loja";
import notificacaoRoutes from "./notificacao/notificacao";
import pagamentoRoutes from "./pagamento/pagamento";

const router = Router();

router.use("/usuario", usuarioRoutes); // => /usuario
router.use("/empresa", empresaRoutes); // => /empresa
router.use("/loja", lojaRoutes); // => /loja
router.use("/notificacao", notificacaoRoutes); // => /notificacao
router.use("/pagamento", pagamentoRoutes); // => /pagamento

export default router;
