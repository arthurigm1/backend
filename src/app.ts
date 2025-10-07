import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";

import routes from "./rotas";
import { errorHandler } from "./middleware/erromiddleware";

const app = express();

// Middleware CORS SUPER SIMPLES
app.use((req: Request, res: Response, next: NextFunction) => {
  // PERMITE TUDO - para teste
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// Routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});



export default app;