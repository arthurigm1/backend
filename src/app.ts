import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import routes from "./rotas";
import { errorHandler } from "./middleware/erromiddleware";
const app = express();
app.use(
  cors({
    origin: [
      "https://incomparable-snickerdoodle-0fe771.netlify.app", // domínio do front em produção
      "http://localhost:3000", // desenvolvimento local React
      "http://localhost:5173", // desenvolvimento local Vite
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ],
    credentials: true, // permite cookies e headers de autenticação
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());

app.use("/api", routes);
app.use(errorHandler);
export default app;
