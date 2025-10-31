import { Router } from "express";
import { EmpresaController } from "../../controller/Empresa/EmpresaController";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireActiveUser } from "../../middleware/active.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";


const router = Router();
const empresaController = new EmpresaController();

// Rota pública para criar empresa
router.post("/criar", empresaController.create);

// Rotas protegidas
router.get("/cnpj/:cnpj", authenticateJWT, requireActiveUser, empresaController.buscarPorCnpj);
router.get("/id/:id", authenticateJWT, requireActiveUser, empresaController.buscarPorId);
router.get("/listar", empresaController.listar);

// Rota para listar inquilinos inadimplentes (apenas admin)
router.get("/inadimplentes", authenticateJWT, requireActiveUser, empresaController.listarInadimplentes);

// Analytics da empresa (protegido)
router.get("/analytics", authenticateJWT, requireActiveUser, empresaController.obterAnalytics);

export default router;