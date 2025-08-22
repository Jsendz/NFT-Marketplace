"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
const RPC = process.env.NEXT_PUBLIC_RPC_URL!; // must be Sepolia

const config = getDefaultConfig({
  appName: "NFT Marketplace",
  projectId: PROJECT_ID,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(RPC),
  },
  ssr: true,
});

export default config;
