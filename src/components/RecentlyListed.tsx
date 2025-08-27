

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";

// GraphQL: use fields that exist in your schema
const GET_RECENT_NFTS = `
  query RecentlyListed($offset:Int!, $limit:Int!) {
    allItemListeds(offset:$offset, first:$limit, orderBy:[BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
      totalCount
      nodes {
        rindexerId
        nftAddress
        tokenId
        price
        txHash
        blockNumber
        txIndex
      }
    }
    allItemBoughts(first: 1000, orderBy:[BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
      nodes { nftAddress tokenId }
    }
    allItemCanceleds(first: 1000, orderBy:[BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
      nodes { nftAddress tokenId }
    }
  }
`;

const PAGE_SIZE = 24;

function k(addr: string, tokenId: string | number) {
  return `${addr.toLowerCase()}:${String(tokenId)}`;
}

function formatEth(wei: string | number | bigint) {
  const v = BigInt(wei || 0);
  const eth = Number(v) / 1e18;
  return eth.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

async function fetchPage(pageIndex: number) {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: GET_RECENT_NFTS,
      variables: { offset: pageIndex * PAGE_SIZE, limit: PAGE_SIZE },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GraphQL fetch failed: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message || "GraphQL error");

  const listed = json.data.allItemListeds.nodes as any[];
  const bought = json.data.allItemBoughts.nodes as any[];
  const canceled = json.data.allItemCanceleds.nodes as any[];

  const closed = new Set<string>(bought.map((b: any) => k(b.nftAddress, b.tokenId)));
  canceled.forEach((c: any) => closed.add(k(c.nftAddress, c.tokenId)));

  const available = listed.filter((n: any) => !closed.has(k(n.nftAddress, n.tokenId)));
  return { available, totalFetched: listed.length };
}

export default function RecentlyListedNFTs() {
  const q = useInfiniteQuery({
    queryKey: ["recently-listed"],
    queryFn: ({ pageParam = 0 }) => fetchPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.totalFetched < PAGE_SIZE ? undefined : all.length),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const items = useMemo(() => q.data?.pages.flatMap((p) => p.available) ?? [], [q.data]);

  if (q.isLoading) return <SkeletonGrid />;

  if (q.isError) {
    return (
      <section className="w-full max-w-4xl mx-auto px-4 text-center py-16">
        <h3 className="text-xl md:text-2xl font-semibold">We couldn't load listings</h3>
        <p className="opacity-70 mt-2 break-words">{(q.error as Error).message}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={() => q.refetch()} className="px-4 py-2 rounded-xl border hover:shadow">Try again</button>
          <Link href="/list-nft" className="px-4 py-2 rounded-xl border hover:shadow">List NFT</Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="w-full max-w-3xl mx-auto px-4 text-center py-16">
        <h3 className="text-xl md:text-2xl font-semibold">No listings yet</h3>
        <p className="opacity-70 mt-2">Be the first to list an NFT, then refresh in a moment.</p>
        <div className="mt-4">
          <Link href="/list-nft" className="px-4 py-2 rounded-xl border hover:shadow">List NFT</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6">
      <header className="flex items-end justify-between mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold">Recently listed</h2>
        <Link href="/explore" className="text-sm underline">Explore all</Link>
      </header>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {items.map((n: any) => {
          const key = `${n.txHash}:${n.blockNumber}:${n.txIndex}`; // stable key w/out `id`
          return (
            <li key={key} className="group rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur p-2 md:p-3 transition">
              <Link href={`/nft/${n.nftAddress}/${n.tokenId}`} className="block">
                {/* TODO: replace placeholder with your Media component (tokenURI → image) */}
                <div className="aspect-square rounded-xl bg-black/5 dark:bg-white/5" />
                <div className="mt-2">
                  <div className="text-xs opacity-70 truncate">{n.nftAddress.slice(0,6)}…{n.nftAddress.slice(-4)} • #{n.tokenId}</div>
                  <div className="text-base md:text-lg font-medium">{formatEth(n.price)} ETH</div>
                </div>
              </Link>

              <div className="mt-2 flex gap-2">
                {/* Gate actions in your buy flow (connect/compliance), not the list grid itself */}
                <button className="flex-1 py-1.5 rounded-xl border text-sm hover:shadow">Buy</button>
                <Link href={`/nft/${n.nftAddress}/${n.tokenId}`} className="px-3 py-1.5 rounded-xl border text-sm">View</Link>
              </div>
            </li>
          );
        })}
      </ul>

      {q.hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            disabled={q.isFetchingNextPage}
            onClick={() => q.fetchNextPage()}
            className="px-4 py-2 rounded-xl border hover:shadow"
          >
            {q.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
      <div className="h-7 w-48 rounded bg-black/10 dark:bg-white/10 mb-4 md:mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/10 dark:border-white/10 p-2 md:p-3">
            <div className="aspect-square rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 w-1/2 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

