import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Seu negócio" },
  { n: 2, label: "Contato e endereço" },
  { n: 3, label: "Dados jurídicos" },
  { n: 4, label: "Revisão" },
];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, idx) => {
        const done    = step.n < current;
        const active  = step.n === current;
        const isLast  = idx === STEPS.length - 1;

        return (
          <div key={step.n} className="flex items-center flex-1 last:flex-none">
            {/* Círculo */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                  done
                    ? "border-primary bg-primary text-white"
                    : active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-white text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.n}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-medium sm:block whitespace-nowrap",
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Linha conectora */}
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1 mt-0 sm:-mt-4 transition-colors",
                  step.n < current ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
