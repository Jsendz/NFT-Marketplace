import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"


interface NFTItem {
     rindexerId: number
  contractAddress: string
  seller: string 
  nftAddress: string 
  tokenId: string 
  price: string 
  txHash: string
  blockNumber: number
  network: string
}

interface BoughtCancelled {

  nftAddress: string 
  tokenId: string 
 
}


interface NFTQueryResponse {
    data: {
        allItemListeds: {
            nodes: NFTItem[]
        },

        allItemBoughts: {
            nodes: NFTItem[]
        },
        allItemCanceleds: {
            nodes: NFTItem[]
        }
    }
}



// GraphQL queries
const GET_RECENT_NFTS = `
  query allItemListeds{
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
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_API_URL
  if (!endpoint) throw new Error("NEXT_PUBLIC_GRAPHQL_API_URL not set")

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GET_RECENT_NFTS }),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GraphQL fetch failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  if (json.errors) throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`)
  return json
}





function useRecentlyListedNFTs() {
    const {data, isLoading, error} = useQuery<NFTQueryResponse>({
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

        const availNfts = data.data.allItemListeds.nodes.filter(item => {
            if (!item.nftAddress || !item.tokenId) return false
            const key = `${item.nftAddress}-${item.tokenId}`
            return !boughtNFTs.has(key) && !cancelledNFTs.has(key)
        })

        const recentNFTs = availNfts.slice(0, 100)

        return recentNFTs.map(nft => ({
            tokenId: nft.tokenId,
            contractAddress: nft.nftAddress,
            price: nft.price,
        }))

    }, [data])

    return { isLoading, error, nftDataList}
}


// Main component that uses the custom hook
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {nftDataList.map (nft => (
                    <Link href={`/buy-nft/${nft.contractAddress}/${nft.tokenId}`}
                        key={`${nft.contractAddress}-${nft.tokenId}`}>
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