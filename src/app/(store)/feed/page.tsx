import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { getFeedPosts } from "@/features/feed/queries";
import { FeedList } from "@/features/feed/components/feed-list";

export const metadata: Metadata = {
  title: "Feed | Nenos Food",
  description: "Novidades e publicações dos restaurantes",
};

export default async function FeedPage() {
  const posts = await getFeedPosts(0);

  return (
    <div className="container max-w-xl py-8">
      <div className="mb-6 flex items-center gap-2">
        <Rss className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Feed</h1>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-muted-foreground">Nenhuma publicação por enquanto.</p>
          <p className="text-sm text-muted-foreground">
            Quando os restaurantes publicarem, aparecerão aqui.{" "}
            <Link href="/" className="text-primary hover:underline">
              Explore restaurantes →
            </Link>
          </p>
        </div>
      ) : (
        <FeedList initialPosts={posts} />
      )}
    </div>
  );
}
