import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@test.com';
// Pre-hashed password for "123456" (10 salt rounds)
const ADMIN_PASSWORD_HASH = bcryptjs.hashSync('123456', 10);

// POST /api/auth/login 
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate request body
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        // Check email
        if (email !== ADMIN_EMAIL) {
            res.status(401).json({ message: 'Invalid credentials.' });
            return;
        }

        // Compare password against stored hash
        const isMatch = await bcryptjs.compare(password, ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials.' });
            return;
        }

        // Sign JWT
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
        if (!secret) {
            res.status(500).json({ message: 'JWT secret is not configured.' });
            return;
        }

        const token = jwt.sign(
            { email: ADMIN_EMAIL, role: 'admin' },
            secret,
            { expiresIn }
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { email: ADMIN_EMAIL, role: 'admin' },
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
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
    res.status(200).json({ user: req.user });
});

export default router;
