import { useSyncExternalStore } from "react";

/** True after client hydration — avoids SSR/client cart count mismatches. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
