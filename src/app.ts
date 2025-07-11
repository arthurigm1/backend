import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import routes from "./rotas";
const app = express();
app.use(
  cors()
  //     {
  //     origin: "frontend.url", // ou vazio
  // }
);

app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());
app.use("/api", routes);
export default app;
