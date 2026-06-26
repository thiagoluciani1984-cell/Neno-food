"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Heart,
  MessageCircle,
  Bookmark,
  Pin,
  PinOff,
  Trash2,
  Loader2,
  FileText,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostForm } from "./post-form";
import { deletePostAction, togglePinAction } from "../actions";
import type { PostWithImages } from "../queries";

/* ── Card de post no dashboard ──────────────────────────────────── */
function DashboardPostCard({
  post,
  onDeleted,
  onPinToggled,
}: {
  post: PostWithImages;
  onDeleted: (id: string) => void;
  onPinToggled: (id: string, pinned: boolean) => void;
}) {
  const [deleting, startDelete] = useTransition();
  const [pinning, startPin] = useTransition();

  const firstImage = post.post_images.sort((a, b) => a.sort_order - b.sort_order)[0];

  function handleDelete() {
    if (!confirm("Remover esta publicação?")) return;
    startDelete(async () => {
      const res = await deletePostAction(post.id);
      if (res.ok) { toast.success("Publicação removida."); onDeleted(post.id); }
      else toast.error(res.error);
    });
  }

  function handlePin() {
    startPin(async () => {
      const res = await togglePinAction(post.id, post.is_pinned);
      if (res.ok) onPinToggled(post.id, !post.is_pinned);
      else toast.error(res.error);
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-muted">
        {firstImage ? (
          <Image
            src={firstImage.url}
            alt="Post"
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {post.post_images.length > 1 && (
          <div className="absolute right-2 top-2">
            <div className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              <Images className="h-3 w-3" /> {post.post_images.length}
            </div>
          </div>
        )}
        {post.is_pinned && (
          <div className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            Fixado
          </div>
        )}
        {/* Ações no hover */}
        <div className="absolute inset-0 flex items-end justify-end gap-1 bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={handlePin}
            disabled={pinning}
            title={post.is_pinned ? "Desafixar" : "Fixar"}
          >
            {pinning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : post.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-7 w-7"
            onClick={handleDelete}
            disabled={deleting}
            title="Remover"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3">
        {post.caption && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{post.caption}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes_count}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments_count}</span>
          <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {post.saves_count}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value.toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
}

/* ── Página principal ────────────────────────────────────────────── */
export function DashboardPostsPage({
  initialPosts,
  stats,
}: {
  initialPosts: PostWithImages[];
  stats: { totalPosts: number; totalLikes: number; totalComments: number; totalSaves: number };
}) {
  const [posts, setPosts] = useState(initialPosts);

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handlePinToggled(id: string, pinned: boolean) {
    setPosts((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, is_pinned: pinned } : p))
        .sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publicações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o conteúdo do seu restaurante na rede social Nenos.
          </p>
        </div>
        <PostForm
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova publicação
            </Button>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Publicações" value={stats.totalPosts} icon={Images} />
        <StatCard label="Curtidas" value={stats.totalLikes} icon={Heart} />
        <StatCard label="Comentários" value={stats.totalComments} icon={MessageCircle} />
        <StatCard label="Salvamentos" value={stats.totalSaves} icon={Bookmark} />
      </div>

      {/* Grid de posts */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Images className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Nenhuma publicação ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie sua primeira publicação para aparecer no feed da plataforma.
            </p>
          </div>
          <PostForm trigger={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Criar publicação</Button>} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <DashboardPostCard
              key={post.id}
              post={post}
              onDeleted={handleDeleted}
              onPinToggled={handlePinToggled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
