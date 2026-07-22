import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/authMiddleware';
import { prisma } from '../db.js';

const router = Router();

// POST /api/auth/register 
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        const errors: Record<string, string> = {};
        if (!name || typeof name !== 'string' || !name.trim()) {
            errors.name = 'Name is required.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.email = 'A valid email address is required.';
        }
        if (!password || password.length < 6) {
            errors.password = 'Password must be at least 6 characters.';
        }

        if (Object.keys(errors).length > 0) {
            res.status(400).json({ errors });
            return;
        }

        // Check if email is already taken
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: 'An account with this email already exists.' });
            return;
        }

        // Hash password and create user
        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
            },
        });

        res.status(201).json({
            message: 'Registration successful.',
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: 'user' },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// POST /api/auth/login 
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate request body
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        // Look up user in the database
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials.' });
            return;
        }

        // Compare password against stored hash
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials.' });
            return;
        }

        // Sign JWT — include user id so routes can scope data to this user
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
        if (!secret) {
            res.status(500).json({ message: 'JWT secret is not configured.' });
            return;
        }

        // Determine role — the seed admin gets 'admin', everyone else gets 'user'
        const role = user.email === 'admin@test.com' ? 'admin' : 'user';

        const token = jwt.sign(
            { id: user.id, email: user.email, role },
            secret,
            { expiresIn }
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// POST /api/auth/logout 
router.post('/logout', authMiddleware, (req: Request, res: Response): void => {
    // Stateless JWT — the client simply discards the token.
    res.status(200).json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me 
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        const role = user.email === 'admin@test.com' ? 'admin' : 'user';
        res.status(200).json({ user: { ...user, role } });
    } catch (error) {
        console.error('/me error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

export default router;
