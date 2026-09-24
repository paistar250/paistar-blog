import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://paistar.eu.cc"),
  title: { default: "Paistar · 工具台", template: "%s | Paistar · 工具台" },
  description: "一组轻巧、直接、在浏览器中运行的日常工具。处理 JSON、时间、编码、文本与二维码。",
  openGraph: { type: "website", locale: "zh_CN", title: "Paistar · 工具台", description: "给每件小事，一个更顺手的入口。", url: "https://paistar.eu.cc" },
};

const themeInit = `try{const t=localStorage.getItem('paistar-theme');const dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning><head><link rel="icon" type="image/svg+xml" href="/favicon.svg"/><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head><body>
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:left-4 focus:top-4 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">跳到主要内容</a>
    <SiteHeader />
    <main id="main">{children}</main>
    <footer className="site-footer"><div className="container-wide flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-semibold text-foreground">Paistar · 工具台</span><span className="ml-3">轻巧、直接、留一点余地。</span></div><div className="flex gap-5"><a href="/about/" className="hover:text-foreground">关于</a><a href="/updates/" className="hover:text-foreground">更新记录</a><a href="https://github.com/paistar250/paistar-blog" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub ↗</a></div></div></footer>
  </body></html>;
}
