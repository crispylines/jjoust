import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';

export default function RoomList() {
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const router = useRouter();
    const { publicKey } = useWallet();

    // Check if current wallet is house wallet
    const isHouseWallet = publicKey?.toString() === process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS;

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        const response = await fetch('/api/rooms');
        const data = await response.json();
        setRooms(data);
    };

    const createRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim() || !isHouseWallet) return;

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newRoomName,
                    creatorWallet: publicKey.toString()
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            
            const newRoom = await response.json();
            setRooms([newRoom, ...rooms]);
            setNewRoomName('');
        } catch (error) {
            console.error('Error creating room:', error);
            alert(error.message || 'Failed to create room');
        }
    };

    const joinRoom = (roomId) => {
        router.push(`/joust/${roomId}`);
    };

    return (
        <div className="room-list">
            {isHouseWallet && (
                <div className="create-room-section">
                    <h2>Create New Room</h2>
                    <form onSubmit={createRoom} className="create-room-form">
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Enter room name"
                        />
                        <button type="submit">Create Room</button>
                    </form>
                </div>
            )}

            <h2>Available Rooms</h2>
            {rooms.length === 0 ? (
                <p>No active rooms available</p>
            ) : (
                rooms.map(room => (
                    <div key={room.id} className="room-item">
                        <span>{room.name}</span>
                        <button onClick={() => joinRoom(room.id)}>Join</button>
                    </div>
                ))
            )}
        </div>
    );
} 