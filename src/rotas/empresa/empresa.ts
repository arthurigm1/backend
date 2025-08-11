import { Router } from "express";
import { EmpresaController } from "../../controller/Empresa/EmpresaController";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();
const empresaController = new EmpresaController();

// Rota pública para criar empresa
router.post("/criar", empresaController.create);

// Rotas protegidas
router.get("/cnpj/:cnpj", authenticateJWT, empresaController.buscarPorCnpj);
router.get("/id/:id", authenticateJWT, empresaController.buscarPorId);
router.get("/listar", authenticateJWT, empresaController.listar);

export default router;