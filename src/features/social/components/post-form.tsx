"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, X, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPostAction } from "../actions";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function PostFormFields({
  previews,
  caption,
  pending,
  fileRef,
  onFiles,
  onRemoveImage,
  onCaptionChange,
  onSubmit,
  onCancel,
}: {
  previews: { file: File; url: string }[];
  caption: string;
  pending: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onCaptionChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="space-y-4 overflow-y-auto">
        <div>
          {previews.length === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Adicionar fotos <span className="text-xs">(máx. 10)</span>
              </p>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={p.url} alt="" fill sizes="150px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {previews.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-primary/50"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={onFiles}
          />
        </div>

        <Textarea
          placeholder="Escreva uma legenda para a sua publicação..."
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={4}
          maxLength={2200}
          className="resize-none"
        />
        <p className="text-right text-xs text-muted-foreground">{caption.length}/2200</p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={pending || (!caption.trim() && previews.length === 0)}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Publicar
            </>
          )}
        </Button>
      </div>
    </>
  );
}

export function PostForm({ trigger }: { trigger: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const newPreviews = selected.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
      setCaption("");
    }
    setOpen(nextOpen);
  }

  function handleSubmit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("caption", caption);
      previews.forEach((p) => fd.append("images", p.file));

      const res = await createPostAction(fd);
      if (res.ok) {
        toast.success("Publicação criada!");
        handleClose(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  const fieldsProps = {
    previews,
    caption,
    pending,
    fileRef,
    onFiles: handleFiles,
    onRemoveImage: removeImage,
    onCaptionChange: setCaption,
    onSubmit: handleSubmit,
    onCancel: () => handleClose(false),
  };

  if (isDesktop === null) {
    return <>{trigger}</>;
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova publicação</DialogTitle>
          </DialogHeader>
          <PostFormFields {...fieldsProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nova publicação</SheetTitle>
        </SheetHeader>
        <PostFormFields {...fieldsProps} />
      </SheetContent>
    </Sheet>
  );
}
