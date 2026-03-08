"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.googleLogin = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
const signToken = (id, role) => jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email and password are required' });
            return;
        }
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, passwordHash },
        });
        const token = signToken(user.id, user.role);
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
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
        const token = signToken(user.id, user.role);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
// POST /api/auth/google
const googleLogin = async (req, res) => {
    try {
        const { googleId, email, name, image } = req.body;
        if (!googleId || !email) {
            res.status(400).json({ error: 'googleId and email required' });
            return;
        }
        let user = await prisma_1.prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });
        if (!user) {
            user = await prisma_1.prisma.user.create({ data: { googleId, email, name, image } });
        }
        else if (!user.googleId) {
            user = await prisma_1.prisma.user.update({ where: { id: user.id }, data: { googleId, image: image || user.image } });
        }
        const token = signToken(user.id, user.role);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image } });
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
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image });
    }
    catch {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.me = me;
