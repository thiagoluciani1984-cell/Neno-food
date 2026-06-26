"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Car,
  FileText,
  CheckCircle2,
  Loader2,
  Upload,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  driverPersonalSchema,
  driverVehicleSchema,
  type DriverPersonalInput,
  type DriverVehicleInput,
} from "../schemas";
import {
  saveDriverPersonalAction,
  saveDriverVehicleAction,
  uploadDriverDocumentAction,
} from "../actions";
import type { DriverProfile } from "../queries";

const STEPS = [
  { id: "personal", label: "Dados pessoais", icon: User },
  { id: "vehicle", label: "Veículo", icon: Car },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "done", label: "Aguardando", icon: CheckCircle2 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const DOC_TYPES = [
  { key: "cnh_front", label: "CNH (frente)" },
  { key: "cnh_back", label: "CNH (verso)" },
  { key: "selfie", label: "Selfie com documento" },
  { key: "proof_of_address", label: "Comprovante de residência" },
] as const;

const VEHICLE_TYPES = [
  { value: "motorcycle", label: "Moto" },
  { value: "bicycle", label: "Bicicleta" },
  { value: "car", label: "Carro" },
  { value: "van", label: "Van" },
] as const;

const PIX_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Celular" },
  { value: "random", label: "Chave aleatória" },
  { value: "cnpj", label: "CNPJ" },
] as const;

/* ── Progresso ─────────────────────────────────────────────────────── */
function StepProgress({ current }: { current: StepId }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                  done
                    ? "border-primary bg-primary text-white"
                    : active
                      ? "border-primary bg-white text-primary"
                      : "border-muted bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-medium sm:block",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 transition-colors",
                  done ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1: Dados pessoais ────────────────────────────────────────── */
function PersonalStep({
  driver,
  onNext,
}: {
  driver: DriverProfile;
  onNext: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverPersonalInput>({
    resolver: zodResolver(driverPersonalSchema),
    defaultValues: {
      cpf: driver.cpf ?? "",
      birth_date: driver.birth_date ?? "",
      pix_key_type: driver.pix_key_type ?? "cpf",
      pix_key: driver.pix_key ?? "",
      emergency_contact_name: driver.emergency_contact_name ?? "",
      emergency_contact_phone: driver.emergency_contact_phone ?? "",
    },
  });

  function onSubmit(data: DriverPersonalInput) {
    startTransition(async () => {
      const result = await saveDriverPersonalAction(data);
      if ("error" in result) toast.error(result.error);
      else onNext();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-bold">Seus dados pessoais</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>CPF</Label>
          <Input placeholder="000.000.000-00" {...register("cpf")} />
          {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Data de nascimento</Label>
          <Input type="date" {...register("birth_date")} />
          {errors.birth_date && (
            <p className="text-xs text-destructive">{errors.birth_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Contato de emergência</Label>
        <Input placeholder="Nome completo" {...register("emergency_contact_name")} />
        {errors.emergency_contact_name && (
          <p className="text-xs text-destructive">{errors.emergency_contact_name.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Input placeholder="Telefone de emergência" {...register("emergency_contact_phone")} />
        {errors.emergency_contact_phone && (
          <p className="text-xs text-destructive">{errors.emergency_contact_phone.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Tipo de chave Pix</Label>
        <select
          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          {...register("pix_key_type")}
        >
          {PIX_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Chave Pix</Label>
        <Input placeholder="Sua chave Pix" {...register("pix_key")} />
        {errors.pix_key && (
          <p className="text-xs text-destructive">{errors.pix_key.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full gap-2" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        Continuar
      </Button>
    </form>
  );
}

/* ── Step 2: Veículo ────────────────────────────────────────────────── */
function VehicleStep({
  driver,
  onNext,
}: {
  driver: DriverProfile;
  onNext: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverVehicleInput>({
    resolver: zodResolver(driverVehicleSchema),
    defaultValues: {
      type: (driver.vehicle?.type as DriverVehicleInput["type"]) ?? "motorcycle",
      brand: driver.vehicle?.brand ?? "",
      model: driver.vehicle?.model ?? "",
      year: driver.vehicle?.year ?? new Date().getFullYear(),
      color: driver.vehicle?.color ?? "",
      plate: driver.vehicle?.plate ?? "",
    },
  });

  function onSubmit(data: DriverVehicleInput) {
    startTransition(async () => {
      const result = await saveDriverVehicleAction(data);
      if ("error" in result) toast.error(result.error);
      else onNext();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-bold">Seu veículo</h2>

      <div className="space-y-1">
        <Label>Tipo de veículo</Label>
        <select
          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          {...register("type")}
        >
          {VEHICLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Marca</Label>
          <Input placeholder="Honda" {...register("brand")} />
          {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Modelo</Label>
          <Input placeholder="CG 160" {...register("model")} />
          {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Ano</Label>
          <Input type="number" placeholder="2022" {...register("year")} />
          {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Cor</Label>
          <Input placeholder="Vermelho" {...register("color")} />
          {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Placa</Label>
        <Input placeholder="ABC-1234" {...register("plate")} />
        {errors.plate && <p className="text-xs text-destructive">{errors.plate.message}</p>}
      </div>

      <Button type="submit" className="w-full gap-2" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        Continuar
      </Button>
    </form>
  );
}

/* ── Step 3: Documentos ─────────────────────────────────────────────── */
function DocumentUploadRow({
  docType,
  label,
  existingStatus,
}: {
  docType: string;
  label: string;
  existingStatus?: string;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    existingStatus === "pending" || existingStatus === "approved" ? "done" : "idle"
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");

    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadDriverDocumentAction(docType, fd);

    if ("error" in result) {
      toast.error(result.error);
      setStatus("error");
    } else {
      toast.success(`${label} enviado!`);
      setStatus("done");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {status === "done"
            ? "Enviado ✓"
            : status === "uploading"
              ? "Enviando…"
              : status === "error"
                ? "Erro no envio"
                : "Aguardando"}
        </p>
      </div>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          type="button"
          size="sm"
          variant={status === "done" ? "outline" : "default"}
          onClick={() => fileRef.current?.click()}
          disabled={status === "uploading"}
        >
          {status === "uploading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          <span className="ml-1.5">{status === "done" ? "Substituir" : "Enviar"}</span>
        </Button>
      </div>
    </div>
  );
}

function DocumentsStep({
  driver,
  onNext,
}: {
  driver: DriverProfile;
  onNext: () => void;
}) {
  const docMap = new Map(driver.documents.map((d) => [d.doc_type, d.status]));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Documentos</h2>
      <p className="text-sm text-muted-foreground">
        Envie fotos nítidas. JPG, PNG, WEBP ou PDF (máx. 10 MB).
      </p>

      <div className="space-y-2">
        {DOC_TYPES.map(({ key, label }) => (
          <DocumentUploadRow
            key={key}
            docType={key}
            label={label}
            existingStatus={docMap.get(key)}
          />
        ))}
      </div>

      <Button className="w-full gap-2" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
        Finalizar cadastro
      </Button>
    </div>
  );
}

/* ── Step 4: Aguardando ─────────────────────────────────────────────── */
function DoneStep() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold">Cadastro enviado!</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Nosso time vai analisar seus documentos. Você receberá um aviso quando
        sua conta for aprovada. Geralmente leva até 24 horas úteis.
      </p>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────────────────── */
export function OnboardingForm({ driver }: { driver: DriverProfile }) {
  const initialStep: StepId =
    driver.approval_status === "approved"
      ? "done"
      : driver.documents.length > 0
        ? "done"
        : driver.vehicle
          ? "documents"
          : driver.cpf
            ? "vehicle"
            : "personal";

  const [step, setStep] = useState<StepId>(initialStep);

  return (
    <div className="space-y-8">
      <StepProgress current={step} />

      <div className="rounded-2xl border bg-white p-6">
        {step === "personal" && (
          <PersonalStep driver={driver} onNext={() => setStep("vehicle")} />
        )}
        {step === "vehicle" && (
          <VehicleStep driver={driver} onNext={() => setStep("documents")} />
        )}
        {step === "documents" && (
          <DocumentsStep driver={driver} onNext={() => setStep("done")} />
        )}
        {step === "done" && <DoneStep />}
      </div>
    </div>
  );
}
