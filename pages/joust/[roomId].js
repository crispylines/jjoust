import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js'; 
import BN from 'bn.js';

export default function JoustRoom({ roomId }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [roomData, setRoomData] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // ... other state variables for images, battle description, winner

  useEffect(() => {
    // Fetch room data (from database or on-chain) based on roomId
    const fetchRoomData = async () => {
      // ... your logic to fetch data
      setRoomData(fetchedData); 
    };
    fetchRoomData();
  }, [roomId]);

  const handlePromptSubmit = async () => {
    setIsLoading(true);
    // 1. Store prompt (database or on-chain)
    // 2. Check if both prompts are submitted
    // 3. If both are submitted, trigger API calls (see below)

    // Example API call (using Next.js API route)
    const res = await fetch('/api/generate-joust', {
      method: 'POST',
      body: JSON.stringify({ roomId, prompt1: /*...*/, prompt2: /*...*/ }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    // Update state with image URLs, battle description, winner

    setIsLoading(false);
  };

  const handleClaimSpoils = async () => {
    if (!publicKey) return; // Wallet not connected
    setIsLoading(true);

    try {
        // Logic to get program id for smart contract
        const programId = new PublicKey("your program id here");

        // Create a transaction to interact with your smart contract
        const transaction = new Transaction().add(
            // Call the instruction to claim spoils on your smart contract
            // You'll need to replace 'claimSpoils' with the actual instruction name
            // in your smart contract, and provide any necessary parameters
            // it may require, such as proof of winning.
            new TransactionInstruction({
                keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    // Add other accounts that your smart contract instruction requires
                    // ...
                ],
                programId,
                data: Buffer.from(Uint8Array.of(0, ...new BN(roomId).toArray("le", 8))), // Example data, replace with actual instruction data
            })
        );

        // Send the transaction
        const signature = await sendTransaction(transaction, connection);

        // Confirm the transaction
        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: signature,
        });

        alert("Spoils claimed successfully!");
    } catch (error) {
        console.error("Error claiming spoils:", error);
        alert("Failed to claim spoils. Please try again.");
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div>
      <h1>Joust Room: {roomId}</h1>
      {/* Display room status, participants, etc. */}
      {/* ... */}
      {/* Prompt input area */}
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handlePromptSubmit} disabled={isLoading}>Submit Prompt</button>

      {/* Display images, battle description */}
      {/* ... */}

      {/* Claim button (only for the winner) */}
      {roomData?.winner === publicKey?.toBase58() && (
        <button onClick={handleClaimSpoils} disabled={isLoading}>Claim Spoils</button>
      )}
    </div>
  );
}

export async function getServerSideProps({ params }) {
    return {
        props: {
            roomId: params.roomId
        }
    };
}