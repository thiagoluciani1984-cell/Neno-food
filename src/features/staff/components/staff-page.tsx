"use client";

import { useActionState, useTransition, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { UserPlus, Trash2, UserCheck, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteStaffAction, removeStaffAction } from "../actions";
import type { StaffMember } from "../queries";

const JOB_TITLES = [
  { value: "gerente",    label: "Gerente" },
  { value: "caixa",      label: "Caixa" },
  { value: "atendente",  label: "Atendente" },
  { value: "cozinheiro", label: "Cozinheiro" },
  { value: "staff",      label: "Outro" },
];

function InviteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <><UserPlus className="mr-2 h-4 w-4" />Adicionar</>
      }
    </Button>
  );
}

function StaffRow({
  member,
  onRemoved,
}: {
  member: StaffMember;
  onRemoved: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  const initials = (member.profile?.full_name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleRemove() {
    startTransition(async () => {
      const res = await removeStaffAction(member.id);
      if (res.ok) {
        toast.success("Membro removido.");
        onRemoved(member.id);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </div>
        <div>
          <p className="font-medium">{member.profile?.full_name ?? "–"}</p>
          <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={member.is_active ? "success" : "muted"} className="hidden sm:flex capitalize">
          {member.job_title}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          disabled={pending}
          onClick={handleRemove}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function StaffPage({ initialMembers }: { initialMembers: StaffMember[] }) {
  const [state, formAction] = useActionState(inviteStaffAction, { ok: true } as never);
  const [members, setMembers] = useState(initialMembers);

  function handleRemoved(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Formulário de convite */}
      <Card>
        <CardHeader><CardTitle>Adicionar membro</CardTitle></CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state && !state.ok && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {state.error}
              </p>
            )}
            {state?.ok === true && (
              <p className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                <UserCheck className="h-4 w-4" /> Membro adicionado com sucesso!
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">E-mail do usuário</Label>
                <Input id="email" name="email" type="email" placeholder="funcionario@email.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job_title">Cargo</Label>
                <select
                  id="job_title" name="job_title"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {JOB_TITLES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O usuário precisa ter uma conta na Nenos Food. Após adicionado, ele acessará o painel deste restaurante.
            </p>
            <InviteButton />
          </form>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipe ({members.filter((m) => m.is_active).length} ativos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum membro adicionado ainda.
            </p>
          ) : (
            <div className="divide-y">
              {members.map((m) => (
                <StaffRow key={m.id} member={m} onRemoved={handleRemoved} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
