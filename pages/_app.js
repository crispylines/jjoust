import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Import styles
import '@solana/wallet-adapter-react-ui/styles.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
    // Network Configuration
    const network = WalletAdapterNetwork.Devnet;

    // Wallet Configuration
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
        ],
        []
    );

    // RPC Endpoint
    const endpoint = useMemo(() => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network), [network]);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <Component {...pageProps} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default MyApp; 