import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const HOUSE_WALLET_ADDRESS = process.env.HOUSE_WALLET_ADDRESS;

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
    else if (req.method === 'POST') {
        const { name, creatorWallet } = req.body;
        
        // Verify the creator is the house wallet
        if (creatorWallet !== HOUSE_WALLET_ADDRESS) {
            return res.status(403).json({ error: 'Only the house wallet can create rooms' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Room name is required' });
        }

        try {
            const room = await prisma.room.create({
                data: {
                    name,
                    active: true,
                    players: []
                }
            });
            res.status(200).json(room);
        } catch (error) {
            console.error('Error creating room:', error);
            res.status(500).json({ error: 'Failed to create room' });
        }
    }
    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 