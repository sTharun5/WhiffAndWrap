"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptTerms = exports.logout = exports.me = exports.googleLogin = exports.login = exports.register = exports.CURRENT_TERMS_VERSION = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
exports.CURRENT_TERMS_VERSION = '1.0';
const signToken = (id, role, lastLoginAt) => jsonwebtoken_1.default.sign({ id, role, lastLoginUnix: lastLoginAt ? lastLoginAt.getTime() : null }, process.env.JWT_SECRET, { expiresIn: '7d' });
const setAuthCookie = (res, token) => {
    res.cookie('ww_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    termsAccepted: zod_1.z.boolean().refine(v => v === true, "Must accept terms and conditions"),
});
// POST /api/auth/register
const register = async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { name, email, password } = parsed.data;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const lastLoginAt = new Date();
        const termsAcceptedAt = new Date();
        const user = await prisma_1.prisma.user.create({
            data: { name, email, passwordHash, lastLoginAt, termsVersion: exports.CURRENT_TERMS_VERSION, termsAcceptedAt },
        });
        const token = signToken(user.id, user.role, lastLoginAt);
        setAuthCookie(res, token);
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: user.termsVersion } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.register = register;
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// POST /api/auth/login
const login = async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { email, password } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const valid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const lastLoginAt = new Date();
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt }
        });
        const token = signToken(user.id, user.role, lastLoginAt);
        setAuthCookie(res, token);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: user.termsVersion } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
const googleLoginSchema = zod_1.z.object({
    googleId: zod_1.z.string().min(1, "googleId is required"),
    email: zod_1.z.string().email("Invalid email format"),
    name: zod_1.z.string().optional(),
    image: zod_1.z.string().optional()
});
// POST /api/auth/google
const googleLogin = async (req, res) => {
    try {
        const parsed = googleLoginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.errors[0].message });
            return;
        }
        const { googleId, email, name, image } = parsed.data;
        let user = await prisma_1.prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });
        const lastLoginAt = new Date();
        if (!user) {
            user = await prisma_1.prisma.user.create({ data: { googleId, email, name: name || "User", image, lastLoginAt } });
        }
        else {
            user = await prisma_1.prisma.user.update({ where: { id: user.id }, data: { googleId, image: image || user.image, lastLoginAt } });
        }
        const token = signToken(user.id, user.role, lastLoginAt);
        setAuthCookie(res, token);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: user.termsVersion } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.googleLogin = googleLogin;
// GET /api/auth/me
const me = async (req, res) => {
    try {
        if (!req.user) {
            res.json(null);
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.json(null);
            return;
        }
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: user.termsVersion });
    }
    catch {
        res.json(null);
    }
};
exports.me = me;
// POST /api/auth/logout
const logout = async (req, res) => {
    res.clearCookie('ww_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ success: true });
};
exports.logout = logout;
// POST /api/auth/accept-terms
const acceptTerms = async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: { termsVersion: exports.CURRENT_TERMS_VERSION, termsAcceptedAt: new Date() }
        });
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, termsVersion: user.termsVersion });
    }
    catch {
        res.status(500).json({ error: 'Server error updating terms' });
    }
};
exports.acceptTerms = acceptTerms;
