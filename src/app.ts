import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import routes from "./rotas";
import { errorHandler } from "./middleware/erromiddleware";

const app = express();

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 8080;

// Configuração CORS
const corsOptions = {
  origin: [
    "https://incomparable-snickerdoodle-0fe771.netlify.app",
    "https://backend-production-780b.up.railway.app",
    "http://localhost:3000",
    "http://localhost:4200", 
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4200",
    "http://127.0.0.1:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  optionsSuccessStatus: 200
};

// CORS PRIMEIRO - MUITO IMPORTANTE!
app.use(cors(corsOptions));

// Middlewares
app.use(morgan("tiny"));

// Helmet configurado para não conflitar com CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // ← ESSENCIAL
  crossOriginEmbedderPolicy: false, // ← IMPORTANTE para CORS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://incomparable-snickerdoodle-0fe771.netlify.app", "https://backend-production-780b.up.railway.app"]
    }
  }
}));

app.use(express.json());

// Middleware personalizado para headers CORS adicionais
app.use((req: Request, res: Response, next: NextFunction) => {
  // Headers CORS adicionais para garantir
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path
  });
});

app.listen(port as number, host, () => {
  console.log('Running CORS-enabled server on ' + host + ':' + port);
});

export default app;