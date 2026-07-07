"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { staggerContainer, feedPostMotion } from "@/lib/motion/nenos-motion";
import { Button } from "@/components/ui/button";
import { PostCard } from "./post-card";
import { fetchMorePostsAction } from "../actions";
import type { FeedPost } from "../queries";

const PAGE_SIZE = 12;

interface FeedListProps {
  initialPosts: FeedPost[];
}

export function FeedList({ initialPosts }: FeedListProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const more = await fetchMorePostsAction(page);
      if (more.length === 0 || more.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...more.filter((p) => !existingIds.has(p.id))];
      });
      setPage((p) => p + 1);
    });
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {posts.map((post) => (
          <motion.div key={post.id} variants={feedPostMotion}>
            <PostCard post={post} />
          </motion.div>
        ))}
      </motion.div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando…
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}

      {!hasMore && posts.length > PAGE_SIZE && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Você chegou ao fim do feed.
        </p>
      )}
    </>
  );
}
