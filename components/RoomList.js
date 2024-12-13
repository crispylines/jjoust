import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RoomList() {
    const [rooms, setRooms] = useState([]);
    const router = useRouter();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        const response = await fetch('/api/rooms');
        const data = await response.json();
        setRooms(data);
    };

    const joinRoom = (roomId) => {
        router.push(`/joust/${roomId}`);
    };

    return (
        <div className="room-list">
            <h2>Available Rooms</h2>
            {rooms.map(room => (
                <div key={room.id} className="room-item">
                    <span>{room.name}</span>
                    <button onClick={() => joinRoom(room.id)}>Join</button>
                </div>
            ))}
        </div>
    );
} 