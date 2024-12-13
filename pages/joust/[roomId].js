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
  const [battleImages, setBattleImages] = useState({ image1: null, image2: null });
  const [battleDescription, setBattleDescription] = useState('');

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        const data = await response.json();
        setRoomData(data);
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };
    
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  const handlePromptSubmit = async () => {
    if (!prompt || !publicKey) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-joust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          prompt,
          walletAddress: publicKey.toString()
        })
      });
      
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update room data with new information
      setRoomData(prevData => ({
        ...prevData,
        ...data
      }));
      
    } catch (error) {
      console.error('Error submitting prompt:', error);
      alert('Failed to submit prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimSpoils = async () => {
    if (!publicKey) return;
    setIsLoading(true);

    try {
      const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
      const transaction = new Transaction().add(
        new TransactionInstruction({
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: new PublicKey(process.env.NEXT_PUBLIC_HOUSE_WALLET), isSigner: false, isWritable: true }
          ],
          programId,
          data: Buffer.from(Uint8Array.of(0, ...new BN(roomId).toArray("le", 8)))
        })
      );

      const signature = await sendTransaction(transaction, connection);
      const latestBlockHash = await connection.getLatestBlockhash();
      
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature
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
    <div className="joust-section">
      <h1>Joust Room: {roomId}</h1>
      
      {roomData && (
        <div className="room-info">
          <p>Status: {roomData.status}</p>
          <p>Players: {roomData.players?.length || 0}/2</p>
        </div>
      )}

      {!roomData?.completed && (
        <div className="prompt-section">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your warrior..."
            disabled={isLoading}
          />
          <button 
            onClick={handlePromptSubmit} 
            disabled={isLoading || !prompt}
          >
            {isLoading ? 'Submitting...' : 'Submit Prompt'}
          </button>
        </div>
      )}

      {roomData?.battleDescription && (
        <div className="battle-section">
          <h2>Battle Description</h2>
          <p>{roomData.battleDescription}</p>
          {roomData.image1Url && (
            <div className="battle-images">
              <img src={roomData.image1Url} alt="Warrior 1" />
              <img src={roomData.image2Url} alt="Warrior 2" />
            </div>
          )}
        </div>
      )}

      {roomData?.winner === publicKey?.toBase58() && (
        <button 
          onClick={handleClaimSpoils} 
          disabled={isLoading}
          className="claim-button"
        >
          {isLoading ? 'Claiming...' : 'Claim Spoils'}
        </button>
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