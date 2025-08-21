
"use client";

import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/magicui/dot-pattern";

export function DotPatternBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <DotPattern
        width={16}
        height={16}
        cx={1}
        cy={1}
        cr={1.5}
        className={cn(
          "[mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_70%)]",
          "opacity-60 fill-white/40"
        )}
      />
    </div>
  );
}
