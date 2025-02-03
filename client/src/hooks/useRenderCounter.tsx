import { useEffect, useRef } from "react";

export default function useRenderCounter(id: string): string {
  const count = useRef(0);

  useEffect(() => {
    count.current++;
  });

  return `Component with id '${id}' has rendered '${count.current}' times.`;
}
