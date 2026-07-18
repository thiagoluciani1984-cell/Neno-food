"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isSoundEnabled,
  setSoundEnabled,
  subscribeSoundEnabled,
  playNewOrderChime,
} from "@/lib/sound";

function getServerSnapshot() {
  return true;
}

export function SoundToggle() {
  const enabled = useSyncExternalStore(subscribeSoundEnabled, isSoundEnabled, getServerSnapshot);

  function toggle() {
    const next = !enabled;
    setSoundEnabled(next);
    if (next) playNewOrderChime();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={enabled ? "Desativar som de alertas" : "Ativar som de alertas"}
      title={enabled ? "Som de alertas ativado" : "Som de alertas desativado"}
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </Button>
  );
}
