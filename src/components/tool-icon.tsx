import { Braces, Clock3, Binary, ScanLine, QrCode } from "lucide-react";
import type { Tool } from "@/lib/tools";

const icons = { braces: Braces, clock: Clock3, binary: Binary, split: ScanLine, qr: QrCode };

export function ToolIcon({ tool, size = 24 }: { tool: Tool; size?: number }) {
  const Icon = icons[tool.icon];
  return <span className={`tool-icon tint-${tool.tint}`} aria-hidden="true"><Icon size={size} strokeWidth={1.8} /></span>;
}
