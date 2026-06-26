"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/money";
import { useCart } from "@/features/cart/use-cart";
import { useEffect, useState } from "react";

export function CartView() {
  const router = useRouter();
  const { items, setQuantity, removeItem, subtotalCents } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-serif text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground">Que tal uma lasanha artesanal?</p>
        <Button asChild>
          <Link href="/">Ver cardápio</Link>
        </Button>
      </div>
    );
  }

  const subtotal = subtotalCents();

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-6 font-serif text-3xl font-bold">Seu carrinho</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBRL(item.unitPriceCents)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="w-20 text-right font-semibold">
                {formatBRL(item.unitPriceCents * item.quantity)}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-3 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatBRL(subtotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Taxa de entrega e descontos são calculados no checkout.
          </p>
          <Separator />
          <Button className="w-full" size="lg" onClick={() => router.push("/checkout")}>
            Finalizar pedido · {formatBRL(subtotal)}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Continuar comprando</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
