
"use client";

import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/magicui/dot-pattern";

export function DotPatternLinearGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "fill-neutral-300/20 [mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
        )}
      />
    </div>
  );
}
