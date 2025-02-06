import { useEffect, useRef, EffectCallback } from "react";

export default function useEffectOnce(effect: EffectCallback): void {
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (hasExecuted.current === false) {
      hasExecuted.current = true;
      const cleanup = effect();
      return cleanup;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
