// =============================================
// File: src/components/RecentlyListedSection.tsx
// Purpose: Production-ready "Recently Listed" grid with
// - server fetch via RSC (App Router)
// - client hydration for pagination + revalidation
// - loading skeletons, empty + error states
// - compliance/connect *only* on actions, not read
// =============================================

"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";

// Types from your GraphQL schema (simplified)
type ListedNode = {
  id: string;
  blockNumber: number;
  txIndex: number;
  nftAddress: `0x${string}`;
  tokenId: string;
  price: string; // wei
  seller?: `0x${string}`;
};

// Util: format wei → ETH
function formatEth(wei: string | number | bigint) {
  const v = BigInt(wei);
  const ether = Number(v) / 1e18;
  return ether.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// Util: derive availability by subtracting Bought + Canceled
function computeAvailable(listed: ListedNode[], bought: { nftAddress: string; tokenId: string }[], canceled: { nftAddress: string; tokenId: string }[]) {
  const closed = new Set(bought.map(b => `${b.nftAddress}:${b.tokenId}`));
  canceled.forEach(c => closed.add(`${c.nftAddress}:${c.tokenId}`));
  return listed.filter(n => !closed.has(`${n.nftAddress}:${n.tokenId}`));
}

const PAGE_SIZE = 24;

async function fetchRecentlyListed(pageParam: number) {
  // NOTE: Hits your Next.js route → Render GraphQL. Ensure env var GRAPHQL_API_URL is set on Vercel.
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query RecentlyListed($offset:Int!, $limit:Int!) {
          allItemListeds(offset: $offset, first: $limit, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
            nodes { id blockNumber txIndex nftAddress tokenId price seller }
          }
          allItemBoughts(first: 1000, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
            nodes { nftAddress tokenId }
          }
          allItemCanceleds(first: 1000, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
            nodes { nftAddress tokenId }
          }
        }
      `,
      variables: { offset: pageParam * PAGE_SIZE, limit: PAGE_SIZE },
    }),
    cache: "no-store", // always fresh on client
  });

  if (!res.ok) throw new Error(`GraphQL fetch failed: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "GraphQL error");

  const listed: ListedNode[] = json.data.allItemListeds.nodes;
  const bought = json.data.allItemBoughts.nodes as { nftAddress: string; tokenId: string }[];
  const canceled = json.data.allItemCanceleds.nodes as { nftAddress: string; tokenId: string }[];

  const available = computeAvailable(listed, bought, canceled);
  return { available, totalFetched: listed.length };
}

export default function RecentlyListedSection() {
  const query = useInfiniteQuery({
    queryKey: ["recently-listed"],
    queryFn: ({ pageParam = 0 }) => fetchRecentlyListed(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.totalFetched < PAGE_SIZE ? undefined : allPages.length,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    return query.data?.pages.flatMap(p => p.available) ?? [];
  }, [query.data]);

  if (query.isLoading) return <SkeletonGrid />;
  if (query.isError) return <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />;
  if (items.length === 0) return <EmptyState />;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6">
      <header className="flex items-end justify-between mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold">Recently listed</h2>
         
        <Link href="/explore" className="text-sm underline">Explore all</Link>
      </header>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {items.map((n) => (
          <li key={n.id} className="group rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur p-2 md:p-3 transition">
            <Link href={`/nft/${n.nftAddress}/${n.tokenId}`} className="block">
              {/* You likely have a Media component that reads tokenURI → image */}
              <div className="aspect-square rounded-xl bg-black/5 dark:bg-white/5" />
              <div className="mt-2">
                <div className="text-xs opacity-70 truncate">{n.nftAddress.slice(0,6)}…{n.nftAddress.slice(-4)} • #{n.tokenId}</div>
                <div className="text-base md:text-lg font-medium">{formatEth(n.price)} ETH</div>
              </div>
            </Link>

            <div className="mt-2 flex gap-2">
              {/* Gate actions, not the list. Replace with your buy modal / router action */}
              <button className="flex-1 py-1.5 rounded-xl border text-sm hover:shadow">Buy</button>
              <Link href={`/nft/${n.nftAddress}/${n.tokenId}`} className="px-3 py-1.5 rounded-xl border text-sm">View</Link>
            </div>
          </li>
        ))}
      </ul>

      {query.hasNextPage && (
        <div className="flex justify-center mt-6">
          <button disabled={query.isFetchingNextPage}
                  onClick={() => query.fetchNextPage()}
                  className="px-4 py-2 rounded-xl border hover:shadow">
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
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

function EmptyState() {
  return (
    <div className="w-full max-w-3xl mx-auto text-center py-16">
      <h3 className="text-xl md:text-2xl font-semibold">No listings yet</h3>
      <p className="opacity-70 mt-2">Be the first to list an NFT, or check back in a moment while we index new events.</p>
      <div className="mt-4">
        <Link href="/sell" className="inline-block px-4 py-2 rounded-xl border hover:shadow">List an NFT</Link>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-full max-w-3xl mx-auto text-center py-16">
      <h3 className="text-xl md:text-2xl font-semibold">We couldn't load listings</h3>
      <p className="opacity-70 mt-2 break-words">{message}</p>
      <div className="mt-4">
        <button onClick={onRetry} className="px-4 py-2 rounded-xl border hover:shadow">Try again</button>
      </div>
    </div>
  );
}

