import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './db';
import { generateTokens, verifyRefreshToken } from './auth';
import { authenticate, AuthRequest } from './middleware';

const app = express();
app.use(cors());
app.use(express.json());

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional()
});

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });
    
    const tokens = generateTokens(user.id);
    res.json({ user: { id: user.id, email: user.email }, ...tokens });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error.issues) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const tokens = generateTokens(user.id);
    res.json({ user: { id: user.id, email: user.email }, ...tokens });
  } catch (error: any) {
    if (error.issues) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const { userId } = verifyRefreshToken(refreshToken);
    const tokens = generateTokens(userId);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// Task routes
app.get('/tasks', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    
    const where: any = { userId: req.userId };
    if (search) where.title = { contains: search };
    if (status === 'completed') where.completed = true;
    if (status === 'pending') where.completed = false;
    
    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.task.count({ where });
    res.json({ tasks, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tasks', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = taskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: { ...data, userId: req.userId! }
    });
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/tasks/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/tasks/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = taskSchema.partial().parse(req.body);
    const task = await prisma.task.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data
    });
    if (task.count === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/tasks/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });
    if (task.count === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/tasks/:id/toggle', authenticate, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    await prisma.task.update({
      where: { id: req.params.id },
      data: { completed: !task.completed }
    });
    res.json({ message: 'Task toggled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});