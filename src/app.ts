import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import routes from "./rotas";
import { errorHandler } from "./middleware/erromiddleware";

const app = express();

// Configuração CORS
const corsOptions = {
  origin: [
    "https://incomparable-snickerdoodle-0fe771.netlify.app",
    "http://localhost:4200",
    "http://localhost:5173"
  ],
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
};

app.use(cors(corsOptions));

// Middlewares
app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());

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

export default app;