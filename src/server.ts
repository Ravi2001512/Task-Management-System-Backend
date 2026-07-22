import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'Server running smoothly' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});