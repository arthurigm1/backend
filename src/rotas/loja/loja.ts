import { Router } from "express";
import { LojaController } from "../../controller/Loja/LojaController";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";


const router = Router();
const lojaController = new LojaController();



// Todas as rotas de loja requerem autenticação
router.use(authenticateJWT);


// Criar nova loja (apenas ADMIN_EMPRESA)
router.post("/criar", requireAdmin, lojaController.create);

// Listar todas as lojas
router.get("/", lojaController.listarLojas);

// Listar lojas da empresa
router.get("/empresa", lojaController.listarLojasDaEmpresa);

// Buscar loja por ID
router.get("/:id", lojaController.buscarPorId);

// Buscar loja por ID (rota alternativa)
router.get("/id/:id", lojaController.buscarPorId);


// Editar loja (apenas ADMIN_EMPRESA)
router.put("/editar/:id", requireAdmin, lojaController.editarLoja);

// Desvincular inquilino (apenas ADMIN_EMPRESA)
router.delete("/desvincular/:id", requireAdmin, lojaController.desvincularInquilino);

export default router;
