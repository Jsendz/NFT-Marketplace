// src/types/forge-artifact.d.ts
declare module "*.json" {
  const value: { abi: import("viem").Abi };
  export default value;
}
