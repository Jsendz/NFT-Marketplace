import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"

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
    allItemListeds: { nodes: NFTItem[] }
    allItemBoughts: { nodes: NFTItem[] }
    allItemCanceleds: { nodes: NFTItem[] }
  }
}

const GET_RECENT_NFTS = `
  query allItemListeds {
    allItemListeds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
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
    allItemBoughts {
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
    allItemCanceleds {
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
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL!;
const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: GET_RECENT_NFTS }),
  cache: "no-store",
});

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GraphQL HTTP ${res.status} ${text}`)
  }

  const json = await res.json()
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

    const boughtNFTs = new Set<string>()
    const cancelledNFTs = new Set<string>()

    data.data.allItemBoughts.nodes.forEach((item) => {
      boughtNFTs.add(`${item.nftAddress}-${item.tokenId}`)
    })

    data.data.allItemCanceleds.nodes.forEach((item) => {
      cancelledNFTs.add(`${item.nftAddress}-${item.tokenId}`)
    })

    const availNfts = data.data.allItemListeds.nodes.filter((item) => {
      if (!item.nftAddress || !item.tokenId) return false
      const key = `${item.nftAddress}-${item.tokenId}`
      return !boughtNFTs.has(key) && !cancelledNFTs.has(key)
    })

    return availNfts.slice(0, 100).map((nft) => ({
      tokenId: nft.tokenId,
      contractAddress: nft.nftAddress,
      price: nft.price || "0",
    }))
  }, [data])

  return { isLoading, error, nftDataList }
}

export default function RecentlyListedNFTs() {
  const { isLoading, error, nftDataList } = useRecentlyListedNFTs()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mt-8 text-center">
        <Link
          href="/list-nft"
          className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          List Your NFT
        </Link>
      </div>
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
              key={`${nft.contractAddress}-${nft.tokenId}`}
              tokenId={nft.tokenId}
              contractAddress={nft.contractAddress}
              price={nft.price}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
