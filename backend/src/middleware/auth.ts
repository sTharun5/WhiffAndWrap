import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

interface JwtPayload {
    id: string;
    role: string;
    lastLoginUnix?: number;
}

export interface AuthRequest extends Request {
    user?: { id: string; role: string; name: string; email: string; image?: string | null };
}

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.ww_token || req.headers.authorization?.split(' ')[1];
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return next();

        if (decoded.lastLoginUnix && user.lastLoginAt) {
            const dbLoginUnix = user.lastLoginAt.getTime();
            if (Math.abs(decoded.lastLoginUnix - dbLoginUnix) > 1000) return next();
        } else if (!decoded.lastLoginUnix && user.lastLoginAt) {
            return next();
        }

        req.user = { id: user.id, role: user.role, name: user.name, email: user.email, image: user.image };
        next();
    } catch {
        next();
    }
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Fallback to Header for flexibility, prioritize cookie
        const token = req.cookies?.ww_token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        // Single session enforcement: Check if token's login time matches DB
        if (decoded.lastLoginUnix && user.lastLoginAt) {
            const dbLoginUnix = user.lastLoginAt.getTime();
            // Allow 1 second leeway for millisecond precision/rounding if needed, 
            // but usually they should match exactly if issued by the same server.
            if (Math.abs(decoded.lastLoginUnix - dbLoginUnix) > 1000) {
                res.status(401).json({ error: 'Session expired due to new login', code: 'SESSION_TERMINATED' });
                return;
            }
        } else if (!decoded.lastLoginUnix && user.lastLoginAt) {
            // Older token without lastLoginUnix but user has lastLoginAt
            res.status(401).json({ error: 'Session expired (new security policy)', code: 'SESSION_TERMINATED' });
            return;
        }

        req.user = { id: user.id, role: user.role, name: user.name, email: user.email, image: user.image };
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden: Admin only' });
        return;
    }
    next();
};
