"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "viem";

const rpc = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org";

const config = getDefaultConfig({
  appName: "NFT Marketplace",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!, // set this on Vercel
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpc),
  },
  ssr: true,
});

export default config;
