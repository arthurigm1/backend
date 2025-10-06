import "express-async-errors";
import express from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import helmet from "helmet";

import routes from "./rotas";
import { errorHandler } from "./middleware/erromiddleware";

const app = express();

const ALLOWED_ORIGINS = new Set<string>([
  "https://incomparable-snickerdoodle-0fe771.netlify.app", // prod
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // Sem origin = ferramentas como curl/Postman -> liberar
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    // às vezes o browser pede também estes (dependendo do agente):
    "Accept",
  ],
  credentials: true, // deixe true só se precisar enviar cookies
  optionsSuccessStatus: 204, // evita 200 + body em proxies chatos
};

// CORS precisa vir antes de tudo
app.use(cors(corsOptions));
// atender explicitamente o preflight em todas as rotas
app.options("*", cors(corsOptions));

app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());

// opcional: health-check
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", routes);

// handler de erros por último
app.use(errorHandler);

export default app;
