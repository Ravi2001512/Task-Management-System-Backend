import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
    id:    string;   // User UUID from database
    email: string;
    role:  string;
}

// Extend Express Request to carry the authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({ message: 'JWT secret is not configured.' });
            return;
        }

        const decoded = jwt.verify(token, secret) as AuthPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
