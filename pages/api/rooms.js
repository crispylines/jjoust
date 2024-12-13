import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const rooms = await prisma.room.findMany({
                where: { active: true },
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json(rooms);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch rooms' });
        }
    }
} 