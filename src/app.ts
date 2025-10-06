import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";

import routes from "./rotas";
import { errorHandler } from "./middleware/erromiddleware";

const app = express();

// Manual CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    "https://incomparable-snickerdoodle-0fe771.netlify.app",
    "http://localhost:4200",
    "http://localhost:5173"
  ];
  
  const origin = req.headers.origin as string;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "false");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());

app.use("/api", routes);
app.use(errorHandler);

export default app;