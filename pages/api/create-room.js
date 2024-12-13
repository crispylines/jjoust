import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name } = req.body;

    try {
      const room = await prisma.room.create({
        data: { name },
      });

      res.status(200).json(room);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 