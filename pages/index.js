import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import RoomList from '../components/RoomList';

const HomePage = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [balance, setBalance] = useState(null);
    const [username, setUsername] = useState('');
    const [userRegistered, setUserRegistered] = useState(false);

    useEffect(() => {
        if (publicKey) {
            checkUserRegistration();
        }
    }, [publicKey]);

    const checkUserRegistration = async () => {
        try {
            const response = await fetch(`/api/check-username?walletAddress=${publicKey.toString()}`);
            const data = await response.json();
            setUserRegistered(!!data.username);
            if (data.username) setUsername(data.username);
        } catch (error) {
            console.error('Error checking username:', error);
        }
    };

    const getBalance = async () => {
        if (!publicKey) return;
        try {
            const balance = await connection.getBalance(publicKey);
            setBalance(balance / 1000000000);
        } catch (error) {
            console.error("Error fetching balance:", error);
            alert("Failed to fetch balance");
        }
    };

    const registerUsername = async (e) => {
        e.preventDefault();
        if (!username || !publicKey) return;

        try {
            const response = await fetch('/api/register-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    walletAddress: publicKey.toString()
                })
            });

            if (response.ok) {
                setUserRegistered(true);
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to register username');
            }
        } catch (error) {
            console.error('Error registering username:', error);
            alert('Failed to register username');
        }
    };

    return (
        <div className="container">
            <h1 className="title">Medieval Jousting Game</h1>
            
            <div className="wallet-section">
                <WalletMultiButton />
                {publicKey && (
                    <>
                        <button className="balance-button" onClick={getBalance}>
                            Get Balance
                        </button>
                        {balance !== null && (
                            <p className="balance-info">Balance: {balance} SOL</p>
                        )}
                    </>
                )}
            </div>

            {publicKey && !userRegistered && (
                <div className="registration-section">
                    <h2>Register Username</h2>
                    <form onSubmit={registerUsername}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                        <button type="submit">Register</button>
                    </form>
                </div>
            )}

            {publicKey && userRegistered && <RoomList />}
        </div>
    );
};

export default HomePage;
