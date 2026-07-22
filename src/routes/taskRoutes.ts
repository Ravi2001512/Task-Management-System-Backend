import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { prisma } from '../db.js';

const router = Router();

// Validation Middleware
const validateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { title, priority, status, dueDate } = req.body;
  const errors: Record<string, string> = {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.title = 'Title is required';
  }

  if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
    errors.priority = 'Priority must be Low, Medium, or High';
  }

  if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
    errors.status = 'Status must be Pending, In Progress, or Completed';
  }

  if (!dueDate || typeof dueDate !== 'string') {
    errors.dueDate = 'Due date is required';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDate)) {
      errors.dueDate = 'Due date must be in YYYY-MM-DD format';
    } else {
      // Calculate today's date in local time YYYY-MM-DD
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const todayStr = localToday.toISOString().split('T')[0];

      if (dueDate < todayStr) {
        errors.dueDate = 'Due date cannot be earlier than today';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ errors });
    return;
  }

  next();
};

// GET /api/tasks
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', authMiddleware, validateTask, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        status,
        dueDate,
      },
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authMiddleware, validateTask, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        status,
        dueDate,
      },
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

