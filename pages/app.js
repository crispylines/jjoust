import '../styles/globals.css'; // Create this file later
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { useMemo } from 'react';

// Default styles that need to be imported regardless of the components you are using
require('@solana/wallet-adapter-react-ui/styles.css');

function MyApp({ Component, pageProps }) {
    // Network Configuration
    const network = WalletAdapterNetwork.Devnet; // Or Mainnet

    // Wallet Configuration
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    // RPC Endpoint Configuration (replace with your own if needed)
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // Custom Connection Configuration (optional)
    const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint]);

    return (
        <ConnectionProvider endpoint={endpoint} config={{ connection }}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <Component {...pageProps} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default MyApp;