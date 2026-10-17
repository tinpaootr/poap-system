import { createConfig, http } from 'wagmi';
import { polygonAmoy, sepolia } from 'wagmi/chains';
import { metaMask, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [polygonAmoy, sepolia],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [polygonAmoy.id]: http(),
    [sepolia.id]: http(),
  },
});