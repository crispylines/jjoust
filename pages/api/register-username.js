import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, walletAddress } = req.body;

    try {
      const user = await prisma.user.create({
        data: {
          username,
          walletAddress,
        },
      });

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to register username' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 