import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { roomId } = req.query;

    if (req.method === 'GET') {
        try {
            const room = await prisma.room.findUnique({
                where: { id: roomId }
            });

            if (!room) {
                return res.status(404).json({ error: 'Room not found' });
            }

            res.status(200).json(room);
        } catch (error) {
            console.error('Error fetching room:', error);
            res.status(500).json({ error: 'Failed to fetch room' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 