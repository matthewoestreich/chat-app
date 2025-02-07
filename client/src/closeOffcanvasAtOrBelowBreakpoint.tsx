import { RefObject } from "react";
import { Offcanvas } from "bootstrap";

class BootstrapBreakpointDetector {
  private breakpointNames: string[];
  private breakpointValues: Record<string, string> | null;

  constructor() {
    this.breakpointNames = ["xxl", "xl", "lg", "md", "sm", "xs"];
    this.breakpointValues = null; // Cache breakpoint values
  }

  public detect(): { name: string; index: number } | null {
    if (!this.breakpointValues) {
      this.breakpointValues = {};
      const isPriorBS5 = !!window.getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-sm");
      const prefix = isPriorBS5 ? "--breakpoint-" : "--bs-breakpoint-";

      for (const breakpointName of this.breakpointNames) {
        const value = window
          .getComputedStyle(document.documentElement)
          .getPropertyValue(prefix + breakpointName)
          .trim();

        if (value) {
          this.breakpointValues[breakpointName] = value;
        }
      }
    }

    let i = this.breakpointNames.length;
    for (const breakpointName of this.breakpointNames) {
      i--;
      const minWidth = this.breakpointValues[breakpointName];
      if (minWidth && window.matchMedia(`(min-width: ${minWidth})`).matches) {
        return { name: breakpointName, index: i };
      }
    }

    return null;
  }
}

type BootstrapBreakpointString = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

const getIndex = (target: BootstrapBreakpointString): number => {
  return { xs: 0, sm: 1, md: 2, lg: 3, xl: 4, xxl: 6 }[target];
};

// prettier-ignore
export default function closeOffcanvasAtOrBelowBreakpoint(offcanvasRef: RefObject<HTMLDivElement | null>, closeAtInclusive: BootstrapBreakpointString,): void {
  if (!offcanvasRef.current) {
    return;
  }

  const current = new BootstrapBreakpointDetector().detect();
  if (!current) {
    return;
  }

  const target = getIndex(closeAtInclusive);

  if (current.index <= target) {
    const BsOffcanvas = Offcanvas.getOrCreateInstance(offcanvasRef.current);
    console.log(BsOffcanvas);
    BsOffcanvas.hide();
  }
}
