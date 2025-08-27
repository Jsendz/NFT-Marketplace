// src/app/page.tsx
import RecentlyListedNFTs from "../components/RecentlyListed";

export default function Home() {
  return (
    <main className="py-6 md:py-8">
      <div className="flex items-center justify-center p-4 md:p-6 xl:p-8 w-full">
        <RecentlyListedNFTs />
      </div>
    </main>
  );
}
