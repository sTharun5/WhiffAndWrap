import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const signToken = (id: string, role: string, lastLoginAt: Date | null) =>
    jwt.sign({ id, role, lastLoginUnix: lastLoginAt ? lastLoginAt.getTime() : null }, process.env.JWT_SECRET!, { expiresIn: '7d' });

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email and password are required' });
            return;
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const lastLoginAt = new Date();
        const user = await prisma.user.create({
            data: { name, email, passwordHash, lastLoginAt } as any,
        });
        const token = signToken(user.id, user.role, lastLoginAt);
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const lastLoginAt = new Date();
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt } as any
        });
        const token = signToken(user.id, user.role, lastLoginAt);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/auth/google
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { googleId, email, name, image } = req.body;
        if (!googleId || !email) {
            res.status(400).json({ error: 'googleId and email required' });
            return;
        }
        let user = await prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });
        const lastLoginAt = new Date();
        if (!user) {
            user = await prisma.user.create({ data: { googleId, email, name, image, lastLoginAt } as any });
        } else {
            user = await prisma.user.update({ where: { id: user.id }, data: { googleId, image: image || user.image, lastLoginAt } as any });
        }
        const token = signToken(user.id, user.role, lastLoginAt);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/auth/me
export const me = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};
