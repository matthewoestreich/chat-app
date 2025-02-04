import { useEffect, useRef } from "react";

export default function useEffectOnce(fn: () => void): void {
  const hasExecuted = useRef(0);

  useEffect(() => {
    if (hasExecuted.current === 0) {
      hasExecuted.current = 1;
      fn();
    }
  }, [fn]);
}
