import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateImage(prompt) {
    // Implement your Stability AI image generation here
    // This is a placeholder
    return "https://placeholder.com/image.jpg";
}

function extractWinner(description, player1Wallet, player2Wallet) {
    // Simple winner extraction logic - you might want to make this more sophisticated
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("player 1 wins")) return player1Wallet;
    if (lowerDesc.includes("player 2 wins")) return player2Wallet;
    return player1Wallet; // Default to player 1 if no clear winner
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { roomId, prompt, walletAddress } = req.body;

    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check if room is already completed
        if (room.completed) {
            return res.status(400).json({ error: 'This battle has already ended' });
        }

        // Update room with player's prompt
        const isFirstPlayer = room.players.length === 0;
        const updateData = isFirstPlayer 
            ? { 
                prompt1: prompt, 
                players: [walletAddress],
                status: 'waiting_for_opponent'
              }
            : { 
                prompt2: prompt, 
                players: [...room.players, walletAddress],
                status: 'battle_in_progress'
              };

        await prisma.room.update({
            where: { id: roomId },
            data: updateData
        });

        // If second player, generate battle
        if (!isFirstPlayer) {
            const [image1Url, image2Url] = await Promise.all([
                generateImage(room.prompt1),
                generateImage(prompt)
            ]);

            const battlePrompt = `Describe a medieval-style fight between these two warriors: ${room.prompt1} VS ${prompt}. Be descriptive and detailed, including their weapons and armor. Clearly state who wins at the end.`;
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(battlePrompt);
            const battleDescription = result.response.text();

            const winner = extractWinner(battleDescription, room.players[0], walletAddress);

            await prisma.room.update({
                where: { id: roomId },
                data: {
                    image1Url,
                    image2Url,
                    battleDescription,
                    winner,
                    completed: true,
                    status: 'completed'
                }
            });

            // Schedule room cleanup
            setTimeout(async () => {
                await prisma.room.update({
                    where: { id: roomId },
                    data: { active: false }
                });
            }, 1000 * 60 * 30); // Clean up after 30 minutes

            return res.status(200).json({ 
                image1Url, 
                image2Url, 
                battleDescription, 
                winner,
                status: 'completed'
            });
        }

        res.status(200).json({ 
            message: 'Prompt submitted successfully',
            status: 'waiting_for_opponent'
        });
    } catch (error) {
        console.error('Generate joust error:', error);
        res.status(500).json({ error: 'Failed to generate joust', details: error.message });
    }
}