import { Router } from "express";
import { UsuarioController } from "../../controller/Usuario/UsuarioController";

const router = Router();
const usuariocontroller = new UsuarioController(); 
router.get("/", (req, res) => {
  res.json({ mensagem: "Rota de usuários funcionando!" });
});
router.post("/" ,usuariocontroller.create);
export default router;
