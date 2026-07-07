"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  Copy,
  Trash2,
  Loader2,
  ImageIcon,
  Sparkles,
  Check,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadToLibraryAction, deleteFromLibraryAction } from "../actions";
import type { ImageLibrary } from "@/types/database.types";

const NENOS_CATEGORIES = [
  { label: "Todos", value: "" },
  { label: "Pizza", value: "pizza" },
  { label: "Hambúrguer", value: "burger" },
  { label: "Sushi", value: "sushi" },
  { label: "Bebidas", value: "drinks" },
  { label: "Sobremesas", value: "desserts" },
  { label: "Italiana", value: "italian" },
  { label: "Vegetariano", value: "vegetarian" },
];

/* ── Cartão de imagem ─────────────────────────────────────────────── */
function ImageCard({
  image,
  onDelete,
  showDelete,
}: {
  image: ImageLibrary;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(image.url);
    setCopied(true);
    toast.success("URL copiada!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Remover esta imagem da biblioteca?")) return;
    setDeleting(true);
    const res = await deleteFromLibraryAction(image.id);
    if (res.ok) {
      onDelete(image.id);
      toast.success("Imagem removida.");
    } else {
      toast.error(res.error);
      setDeleting(false);
    }
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
      <Image
        src={image.thumbnail_url ?? image.url}
        alt={image.category ?? "Imagem"}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Overlay com ações */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {image.category && (
          <Badge variant="secondary" className="mb-2 w-fit text-[10px]">
            {image.category}
          </Badge>
        )}
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 flex-1 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <><Check className="mr-1 h-3 w-3" /> Copiada</>
            ) : (
              <><Copy className="mr-1 h-3 w-3" /> Copiar URL</>
            )}
          </Button>
          {showDelete && onDelete && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-7 w-7 shrink-0"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Zona de upload ───────────────────────────────────────────────── */
function UploadZone({ onUploaded }: { onUploaded: (image: ImageLibrary) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function processFiles(files: FileList) {
    setUploading(true);
    setProgress(0);
    const list = Array.from(files);
    let done = 0;

    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadToLibraryAction(fd);
      done++;
      setProgress(Math.round((done / list.length) * 100));
      if (res.ok) {
        onUploaded(res.image);
      } else {
        toast.error(`${file.name}: ${res.error}`);
      }
    }

    setUploading(false);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && fileRef.current?.click()}
      className={[
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40",
        uploading ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <input
        ref={fileRef}
        type="file"
        hidden
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Enviando... {progress}%</p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              Arraste imagens aqui ou{" "}
              <span className="text-primary underline-offset-2 hover:underline">
                clique para selecionar
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, WEBP · Máx. 5 MB por arquivo · Múltiplos arquivos permitidos
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Grid vazio ──────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────── */
export function StudioPage({
  myImages: initialMyImages,
  nenosImages,
}: {
  myImages: ImageLibrary[];
  nenosImages: ImageLibrary[];
}) {
  const router = useRouter();
  const [myImages, setMyImages] = useState(initialMyImages);
  const [prevInitialMyImages, setPrevInitialMyImages] = useState(initialMyImages);
  const [nenosCategory, setNenosCategory] = useState("");

  if (initialMyImages !== prevInitialMyImages) {
    setPrevInitialMyImages(initialMyImages);
    setMyImages(initialMyImages);
  }

  const filteredNenos = nenosCategory
    ? nenosImages.filter((img) => img.category === nenosCategory)
    : nenosImages;

  function handleUploaded(image: ImageLibrary) {
    setMyImages((prev) => [image, ...prev]);
    toast.success("Imagem adicionada à biblioteca.");
  }

  function handleDeleted(id: string) {
    setMyImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nenos Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Biblioteca de imagens gastronômicas para usar nos seus produtos e publicações.
        </p>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Minhas Fotos
            {myImages.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {myImages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="nenos" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Biblioteca Nenos
            {nenosImages.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {nenosImages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Minhas Fotos ─────────────────────────────────────────── */}
        <TabsContent value="my" className="mt-6 space-y-6">
          <UploadZone onUploaded={handleUploaded} />

          {myImages.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="Nenhuma imagem ainda"
              description="Faça upload das suas fotos de pratos e use em produtos, posts e publicações."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {myImages.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onDelete={handleDeleted}
                  showDelete
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Biblioteca Nenos ──────────────────────────────────────── */}
        <TabsContent value="nenos" className="mt-6 space-y-6">
          {/* Filtro de categorias */}
          <div className="flex flex-wrap gap-2">
            {NENOS_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setNenosCategory(cat.value)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  nenosCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                ].join(" ")}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {nenosImages.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Biblioteca em construção"
              description="Em breve, fotos profissionais de pratos para você usar gratuitamente."
            />
          ) : filteredNenos.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="Nenhuma imagem nesta categoria"
              description="Tente outro filtro ou selecione 'Todos'."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredNenos.map((img) => (
                <ImageCard key={img.id} image={img} showDelete={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
