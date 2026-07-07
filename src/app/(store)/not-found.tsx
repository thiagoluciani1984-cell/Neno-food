import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <Search className="h-12 w-12 text-muted-foreground/40" />
      <h1 className="text-xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O restaurante ou página que você procura não existe ou foi removido.
      </p>
      <Button asChild>
        <Link href="/">Explorar restaurantes</Link>
      </Button>
    </div>
  );
}
