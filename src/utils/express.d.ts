// src/types/express.d.ts
import { JwtPayload } from "jsonwebtoken";

interface UserPayload extends JwtPayload {
  id: string;
  email: string;
  empresaId: string;
  tipo: 'ADMIN_EMPRESA' | 'FUNCIONARIO' | 'INQUILINO';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
