"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  toggleLikeAction,
  toggleSaveAction,
  addCommentAction,
  fetchPostCommentsAction,
  reportPostAction,
  type PostComment,
} from "../actions";
import { likeMotion, likeCountMotion, saveMotion } from "@/lib/motion/nenos-motion";
import { cn } from "@/lib/utils";
import type { FeedPost } from "../queries";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(
    new Date(dateStr)
  );
}

function ImageCarousel({ images }: { images: FeedPost["post_images"] }) {
  const [current, setCurrent] = useState(0);
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  if (sorted.length === 0) return null;

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-muted">
      <Image
        src={sorted[current].url}
        alt={sorted[current].alt ?? ""}
        fill
        sizes="(max-width: 640px) 100vw, 600px"
        className="object-cover"
        priority={current === 0}
      />
      {sorted.length > 1 && (
        <>
          {current > 0 && (
            <button
              type="button"
              onClick={() => setCurrent((c) => c - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {current < sorted.length - 1 && (
            <button
              type="button"
              onClick={() => setCurrent((c) => c + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={[
                  "h-1.5 rounded-full transition-all",
                  i === current ? "w-4 bg-white" : "w-1.5 bg-white/50",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CommentsSection({
  postId,
  initialCount,
  onCountChange,
}: {
  postId: string;
  initialCount: number;
  onCountChange: (n: number) => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPostCommentsAction(postId).then((data) => {
      setComments(data);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }, [postId]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    const res = await addCommentAction(postId, trimmed);
    setSending(false);
    if ("ok" in res) {
      const newComment: PostComment = {
        id: crypto.randomUUID(),
        body: trimmed,
        created_at: new Date().toISOString(),
        author: { id: "", full_name: "Você", avatar_url: null },
      };
      setComments((prev) => [...prev, newComment]);
      onCountChange(initialCount + comments.length + 1);
      setBody("");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="border-t">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-h-52 overflow-y-auto">
          {comments.length === 0 && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              Seja o primeiro a comentar.
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 px-4 py-2">
              <div className="relative mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
                {c.author.avatar_url ? (
                  <Image
                    src={c.author.avatar_url}
                    alt={c.author.full_name}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {c.author.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs">
                  <span className="mr-1 font-semibold">{c.author.full_name}</span>
                  {c.body}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {relativeTime(c.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t px-4 py-2">
        <Input
          ref={inputRef}
          placeholder="Adicione um comentário..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="h-8 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-primary"
          onClick={handleSend}
          disabled={sending || !body.trim()}
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function LikeParticles({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 0],
              scale: [0.4, 1.1],
              x: Math.cos(angle) * 16,
              y: Math.sin(angle) * 16 - 6,
            }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary"
          />
        );
      })}
    </span>
  );
}

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.is_liked);
  const [saved, setSaved] = useState(post.is_saved);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [likeBurst, setLikeBurst] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);

  async function handleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) {
      setLikeBurst(true);
      window.setTimeout(() => setLikeBurst(false), 420);
    }

    const res = await toggleLikeAction(post.id);
    if ("error" in res) {
      toast.error(res.error);
      setLiked(wasLiked);
      setLikesCount((c) => c + (wasLiked ? 1 : -1));
    }
  }

  async function handleSave() {
    const wasSaved = saved;
    setSaved(!wasSaved);

    const res = await toggleSaveAction(post.id);
    if ("error" in res) {
      toast.error(res.error);
      setSaved(wasSaved);
    }
  }

  async function handleReport(reason: string) {
    const res = await reportPostAction(post.id, reason);
    if ("error" in res) toast.error(res.error);
    else toast.success("Denúncia enviada. Obrigado!");
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-orange-100 bg-card hover-nenos-lift">
      <div className="flex items-center gap-3 p-3">
        <Link
          href={`/${post.restaurant.slug}`}
          className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border bg-muted"
        >
          {post.restaurant.logo_url ? (
            <Image
              src={post.restaurant.logo_url}
              alt={post.restaurant.name}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
              {post.restaurant.name[0]}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/${post.restaurant.slug}`}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {post.restaurant.name}
          </Link>
          <p className="text-xs text-muted-foreground">{relativeTime(post.created_at)}</p>
        </div>
        {post.is_pinned && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Destaque
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Mais opções"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleReport("spam")}>
              <Flag className="mr-2 h-4 w-4" />
              Denunciar spam
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReport("inappropriate")}>
              <Flag className="mr-2 h-4 w-4" />
              Conteúdo impróprio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReport("misleading")}>
              <Flag className="mr-2 h-4 w-4" />
              Informação falsa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {post.post_images.length > 0 && <ImageCarousel images={post.post_images} />}

      <div className="flex items-center gap-1 px-3 pt-3">
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={handleLike}
            animate={liked ? "liked" : "idle"}
            variants={likeMotion}
            whileTap={{ scale: 0.88 }}
            className={cn(
              "relative rounded-lg px-2 py-1.5",
              liked ? "text-primary" : "text-stone-900"
            )}
            aria-label={liked ? "Descurtir" : "Curtir"}
          >
            <LikeParticles active={likeBurst} />
            <Heart className={cn("h-6 w-6", liked && "fill-primary")} />
          </motion.button>
          {likesCount > 0 && (
            <motion.span
              key={likesCount}
              variants={likeCountMotion}
              initial="initial"
              animate="animate"
              className="text-xs font-medium text-stone-900"
            >
              {likesCount}
            </motion.span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageCircle
            className={["h-5 w-5", showComments ? "fill-muted text-foreground" : ""].join(" ")}
          />
          {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
        </button>

        <motion.button
          type="button"
          onClick={handleSave}
          animate={saved ? "saved" : "idle"}
          variants={saveMotion}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "ml-auto rounded-lg px-2 py-1.5",
            saved ? "text-secondary" : "text-stone-900"
          )}
          aria-label={saved ? "Remover dos salvos" : "Salvar"}
        >
          <Bookmark className={cn("h-6 w-6", saved && "fill-secondary")} />
        </motion.button>
      </div>

      {post.caption && (
        <div className="px-4 pb-2 pt-1">
          <p className="text-sm">
            <Link
              href={`/${post.restaurant.slug}`}
              className="mr-1.5 font-semibold hover:underline"
            >
              {post.restaurant.name}
            </Link>
            {post.caption}
          </p>
        </div>
      )}

      {showComments && (
        <CommentsSection
          postId={post.id}
          initialCount={commentsCount}
          onCountChange={setCommentsCount}
        />
      )}
    </article>
  );
}
