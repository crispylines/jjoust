import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateImage(prompt) {
    try {
        // Add your Stability AI implementation here
        // For now, return a placeholder
        return "https://via.placeholder.com/400";
    } catch (error) {
        console.error('Error generating image:', error);
        throw new Error('Failed to generate image');
    }
}

function extractWinner(description, player1Wallet, player2Wallet) {
    try {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes("player 1 wins")) return player1Wallet;
        if (lowerDesc.includes("player 2 wins")) return player2Wallet;
        return player1Wallet; // Default to player 1 if no clear winner
    } catch (error) {
        console.error('Error extracting winner:', error);
        return player1Wallet;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { roomId, prompt, walletAddress } = req.body;
    console.log('Received request:', { roomId, prompt, walletAddress });

    if (!roomId || !prompt || !walletAddress) {
        console.log('Missing required fields:', { roomId, prompt, walletAddress });
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Get room data
        console.log('Fetching room:', roomId);
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            console.log('Room not found:', roomId);
            return res.status(404).json({ error: 'Room not found' });
        }

        console.log('Found room:', room);

        if (room.completed) {
            return res.status(400).json({ error: 'Battle already completed' });
        }

        // Check if player already submitted
        if (room.players?.includes(walletAddress)) {
            return res.status(400).json({ error: 'You have already submitted a prompt' });
        }

        // Update room with player's prompt
        const isFirstPlayer = !room.players || room.players.length === 0;
        const updateData = isFirstPlayer 
            ? { 
                prompt1: prompt, 
                players: [walletAddress],
                status: 'waiting_for_opponent'
              }
            : { 
                prompt2: prompt, 
                players: [...(room.players || []), walletAddress],
                status: 'battle_in_progress'
              };

        console.log('Updating room with:', updateData);
        
        const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: updateData
        });

        console.log('Room updated:', updatedRoom);

        // If second player, generate battle
        if (!isFirstPlayer) {
            try {
                console.log('Generating battle...');
                const [image1Url, image2Url] = await Promise.all([
                    generateImage(room.prompt1),
                    generateImage(prompt)
                ]);

                const battlePrompt = `Describe a medieval-style fight between these two warriors: ${room.prompt1} VS ${prompt}. Be descriptive and detailed, including their weapons and armor. Clearly state who wins at the end.`;
                console.log('Battle prompt:', battlePrompt);

                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = await model.generateContent(battlePrompt);
                const battleDescription = result.response.text();

                console.log('Battle description generated:', battleDescription);

                const winner = extractWinner(battleDescription, room.players[0], walletAddress);
                console.log('Winner determined:', winner);

                const finalRoom = await prisma.room.update({
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

                console.log('Final room update:', finalRoom);
                return res.status(200).json(finalRoom);
            } catch (error) {
                console.error('Battle generation error:', error);
                return res.status(500).json({ 
                    error: 'Failed to generate battle',
                    details: error.message,
                    stack: error.stack
                });
            }
        }

        res.status(200).json(updatedRoom);
    } catch (error) {
        console.error('Generate joust error:', error);
        res.status(500).json({ 
            error: 'Failed to generate joust', 
            details: error.message,
            stack: error.stack
        });
    }
}