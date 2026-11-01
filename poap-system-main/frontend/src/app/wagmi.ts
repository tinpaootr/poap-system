import { createConfig, http } from 'wagmi';
import { polygonAmoy, sepolia } from 'wagmi/chains';
import { metaMask, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [polygonAmoy, sepolia],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Club POAP System",
        url: "http://localhost:3000",
      },
    }),
    injected(),
  ],
  transports: {
    [polygonAmoy.id]: http(),
    [sepolia.id]: http(),
  },
});