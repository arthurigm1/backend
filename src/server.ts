import dotenv from "dotenv";
import app from "./app";
dotenv.config();

const port: number = parseInt(`${process.env.PORT} || 3000`);
app.listen(port, () => {
  console.log("Servidor Rodando");
});
