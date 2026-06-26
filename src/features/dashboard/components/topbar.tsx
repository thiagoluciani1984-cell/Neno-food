"use client";

import { LogOut, Store } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function Topbar({
  restaurantName,
  userName,
}: {
  restaurantName: string;
  userName: string;
}) {
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-2 text-sm">
        <Store className="h-4 w-4 text-primary" />
        <span className="font-medium">{restaurantName}</span>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/" target="_blank">
            Ver loja
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none">
              <Avatar>
                <AvatarFallback>{initials || "DQ"}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <button type="submit" className="w-full">
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
