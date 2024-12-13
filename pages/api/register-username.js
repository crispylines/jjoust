import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, walletAddress } = req.body;

  if (!username || !walletAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if wallet already registered
    const existingWallet = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet already registered' });
    }

    const user = await prisma.user.create({
      data: {
        username,
        walletAddress,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register username', details: error.message });
  }
} 