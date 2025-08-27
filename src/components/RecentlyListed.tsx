"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import Link from "next/link"
import NFTBox from "./NFTBox"

interface NFTItem {
  rindexerId: number
  contractAddress: string
  seller?: string
  buyer?: string
  nftAddress: string
  tokenId: string
  price?: string
  txHash: string
  blockNumber: number
  network: string
}

interface NFTQueryResponse {
  data: {
    allItemListeds: { nodes: NFTItem[]; totalCount: number }
    allItemBoughts: { nodes: NFTItem[] }
    allItemCanceleds: { nodes: NFTItem[] }
  }
  errors?: unknown
}

const GET_RECENT_NFTS = `
  query allItemListeds {
    allItemListeds(first: 100, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
      nodes {
        rindexerId
        contractAddress
        seller
        nftAddress
        tokenId
        price
        txHash
        blockNumber
        network
      }
      totalCount
    }
    allItemBoughts(first: 100, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
      nodes {
        rindexerId
        contractAddress
        buyer
        nftAddress
        tokenId
        price
        txHash
        blockNumber
        network
      }
    }
    allItemCanceleds(first: 100, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
      nodes {
        rindexerId
        contractAddress
        seller
        nftAddress
        tokenId
        txHash
        blockNumber
        network
      }
    }
  }
`

async function fetchNFTs(): Promise<NFTQueryResponse> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GET_RECENT_NFTS }),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GraphQL HTTP ${res.status} ${text}`)
  }

  const json = (await res.json()) as NFTQueryResponse
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`)
  return json
}

function useRecentlyListedNFTs() {
  const { data, isLoading, error } = useQuery<NFTQueryResponse>({
    queryKey: ["recentNFTs"],
    queryFn: fetchNFTs,
  })

  const nftDataList = useMemo(() => {
    if (!data) return []

    const bought = new Set<string>()
    const cancelled = new Set<string>()

    data.data.allItemBoughts.nodes.forEach((i) => {
      bought.add(`${i.nftAddress}-${i.tokenId}`)
    })
    data.data.allItemCanceleds.nodes.forEach((i) => {
      cancelled.add(`${i.nftAddress}-${i.tokenId}`)
    })

    const avail = data.data.allItemListeds.nodes.filter((i) => {
      if (!i.nftAddress || !i.tokenId) return false
      const key = `${i.nftAddress}-${i.tokenId}`
      return !bought.has(key) && !cancelled.has(key)
    })

    return avail.slice(0, 100).map((nft) => ({
      tokenId: nft.tokenId,
      contractAddress: nft.nftAddress, // normalize for routes/NFTBox
      price: nft.price || "0",
    }))
  }, [data])

  return { nftDataList, isLoading, error }
}

export default function RecentlyListedNFTs() {
  const { nftDataList, isLoading, error } = useRecentlyListedNFTs()

  return (
    <div className="w-full max-w-7xl">
      <h2 className="text-2xl font-bold mb-6">Recently Listed NFTs</h2>

      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-500">Error: {(error as Error).message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {nftDataList.map((nft) => (
          <Link
            href={`/buy-nft/${nft.contractAddress}/${nft.tokenId}`}
            key={`${nft.contractAddress}-${nft.tokenId}`}
          >
            <NFTBox
              tokenId={nft.tokenId}
              contractAddress={nft.contractAddress}
              price={nft.price}
            />
          </Link>
        ))}
      </div>

      {/* List NFT button */}
      <div className="mt-8 flex justify-center">
        <Link href="/list-nft">
          <button className="px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            List NFT
          </button>
        </Link>
      </div>
    </div>
  )
}
