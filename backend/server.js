import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());


// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    res.status(201).json(user);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});


// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: 'Invalid password'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});


// CREATE FEEDBACK
app.post('/api/feedback', async (req, res) => {
  try {

    const { message, rating, userId } = req.body;

    const feedback = await prisma.feedback.create({
      data: {
        message,
        rating,
        userId
      }
    });

    res.status(201).json(feedback);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});


// GET FEEDBACKS
app.get('/api/feedback', async (req, res) => {
  try {

    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(feedbacks);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});