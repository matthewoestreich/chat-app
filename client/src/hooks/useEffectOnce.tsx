import { useEffect, useRef, EffectCallback } from "react";

export default function useEffectOnce(effect: EffectCallback): void {
  const hasExecuted = useRef(false);

  useEffect(() => {
    let cleanup;

    if (hasExecuted.current === false) {
      hasExecuted.current = true;
      cleanup = effect();
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
