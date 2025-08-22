import type { Abi } from "viem";
import Artifact from "@/constants/abis/NftMarketplace.json";

// Tell TS what the JSON shape is
const nftMarketplace = Artifact as { abi: Abi };
export const MARKETPLACE_ABI: Abi = nftMarketplace.abi;