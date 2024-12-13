import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stabilityApiKey = process.env.STABILITY_API_KEY;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const solanaConnection = new Connection(process.env.SOLANA_RPC_URL);

const HOUSE_WALLET = new PublicKey(process.env.HOUSE_WALLET_ADDRESS);
const JOUST_COST = 0.1 * 1e9; // 0.1 SOL in lamports
const HOUSE_FEE = 0.01 * 1e9; // 0.01 SOL in lamports

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { roomId, prompt1, prompt2, player1Wallet, player2Wallet } = req.body;

    try {
      // Verify transaction signatures and amounts here
      // This is a simplified version - you'll need to implement proper transaction verification

      // Generate images and battle description
      const [image1Url, image2Url] = await Promise.all([
        generateImage(prompt1),
        generateImage(prompt2)
      ]);

      const battlePrompt = `Describe a medieval-style fight between these two warriors in a forest setting: ${prompt1} VS ${prompt2}. Be descriptive and detailed, including their weapons and armor. Clearly state who wins at the end.`;
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(battlePrompt);
      const battleDescription = result.response.text();

      const winner = extractWinner(battleDescription, player1Wallet, player2Wallet);

      // Update database
      await prisma.joust.update({
        where: { id: roomId },
        data: {
          prompt1,
          prompt2,
          image1Url,
          image2Url,
          winner,
          completed: true
        }
      });

      res.status(200).json({ 
        image1Url, 
        image2Url, 
        battleDescription, 
        winner 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate joust' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function generateImage(prompt) {
  // Replace this with the actual Stability AI API call
  // Example using a placeholder (you'll need to adapt it)
  const response = await fetch(
    `https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${stabilityApiKey}`,
      },
      body: JSON.stringify({
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 30,
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ]
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Stability AI API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data[0].url; // Adjust based on the actual Stability AI response
}

function extractWinner(battleDescription, player1Wallet, player2Wallet) {
  const lowerDesc = battleDescription.toLowerCase();
  if (lowerDesc.includes('warrior 1 wins') || lowerDesc.includes('first warrior emerges victorious')) {
    return player1Wallet;
  } else if (lowerDesc.includes('warrior 2 wins') || lowerDesc.includes('second warrior emerges victorious')) {
    return player2Wallet;
  }
  return null; // Force a rematch if winner is unclear
}