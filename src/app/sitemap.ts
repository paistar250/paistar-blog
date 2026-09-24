import type { MetadataRoute } from "next";
export const dynamic = "force-static";
import { tools } from "@/lib/tools";
export default function sitemap(): MetadataRoute.Sitemap { const base = "https://paistar.eu.cc"; return ["/", "/about/", "/updates/", ...tools.map((tool) => `/tools/${tool.id}/`)].map((path) => ({ url: `${base}${path}`, lastModified: new Date("2026-09-24"), changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : .7 })); }
