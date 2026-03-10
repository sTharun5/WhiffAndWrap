import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';

export const CURRENT_TERMS_VERSION = '1.0';

const signToken = (id: string, role: string, lastLoginAt: Date | null) =>
    jwt.sign({ id, role, lastLoginUnix: lastLoginAt ? lastLoginAt.getTime() : null }, process.env.JWT_SECRET!, { expiresIn: '7d' });

const setAuthCookie = (res: Response, token: string) => {
    res.cookie('ww_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    termsAccepted: z.boolean().refine(v => v === true, "Must accept terms and conditions"),
});

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: (parsed.error as any).errors[0].message });
            return;
        }
        const { name, email, password } = parsed.data;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const lastLoginAt = new Date();
        const termsAcceptedAt = new Date();
        const user = await prisma.user.create({
            data: { name, email, passwordHash, lastLoginAt, termsVersion: CURRENT_TERMS_VERSION, termsAcceptedAt } as any,
        });
        const token = signToken(user.id, user.role, lastLoginAt);
        setAuthCookie(res, token);
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: (user as any).termsVersion } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: (parsed.error as any).errors[0].message });
            return;
        }
        const { email, password } = parsed.data;
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
        setAuthCookie(res, token);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: (user as any).termsVersion } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const googleLoginSchema = z.object({
    googleId: z.string().min(1, "googleId is required"),
    email: z.string().email("Invalid email format"),
    name: z.string().optional(),
    image: z.string().optional()
});

// POST /api/auth/google
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const parsed = googleLoginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: (parsed.error as any).errors[0].message });
            return;
        }
        const { googleId, email, name, image } = parsed.data;
        let user = await prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });
        const lastLoginAt = new Date();
        if (!user) {
            user = await prisma.user.create({ data: { googleId, email, name: name || "User", image, lastLoginAt } as any });
        } else {
            user = await prisma.user.update({ where: { id: user.id }, data: { googleId, image: image || user.image, lastLoginAt } as any });
        }
        const token = signToken(user.id, user.role, lastLoginAt);
        setAuthCookie(res, token);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: (user as any).termsVersion } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/auth/me
export const me = async (req: any, res: Response) => {
    try {
        if (!req.user) {
            res.json(null);
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.json(null);
            return;
        }
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: (user as any).termsVersion });
    } catch {
        res.json(null);
    }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
    res.clearCookie('ww_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ success: true });
};

// POST /api/auth/accept-terms
export const acceptTerms = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { termsVersion: CURRENT_TERMS_VERSION, termsAcceptedAt: new Date() } as any
        });
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: (user as any).termsVersion });
    } catch {
        res.status(500).json({ error: 'Server error updating terms' });
    }
};
