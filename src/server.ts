import dotenv from "dotenv";
import app from "./app";
dotenv.config();

const port: number = parseInt(`${process.env.PORT} || 3010`);
app.listen(3010, () => {
  console.log("Servidor Rodando");
});
