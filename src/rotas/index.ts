// src/rotas/index.ts
import { Router } from "express";
import usuarioRoutes from "./usuario/usuario";
import empresaRoutes from "./empresa/empresa";
import lojaRoutes from "./loja/loja";
import notificacaoRoutes from "./notificacao/notificacao";
import contratoRoutes from "./contrato/contrato";
import faturaRoutes from "./fatura/fatura";
import portalInquilinoRoutes from "./portaldoinquilino/portalinquilino";
import efiRoutes from "../routes/efiRoutes";

const router = Router();

router.use("/usuario", usuarioRoutes); // => /usuario
router.use("/empresa", empresaRoutes); // => /empresa
router.use("/loja", lojaRoutes); // => /loja
router.use("/notificacao", notificacaoRoutes); // => /notificacao
router.use("/contrato", contratoRoutes); // => /contrato
router.use("/fatura", faturaRoutes); // => /fatura
// Rotas do portal do inquilino
router.use("/portal-inquilino", portalInquilinoRoutes);
// Rotas da EFI Pagamentos
router.use("/efi", efiRoutes); // => /efi

export default router;
