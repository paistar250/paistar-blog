"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, Moon, Search, Sun, X } from "lucide-react";

const links = [{ href: "/", label: "工具台" }, { href: "/about/", label: "关于" }, { href: "/updates/", label: "更新记录" }];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-motion");
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    try { localStorage.setItem("paistar-theme", dark ? "dark" : "light"); } catch { /* Storage may be unavailable. */ }
  };

  return <header className="site-header" aria-label="网站导航">
    <div className="site-header-inner glass">
      <Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setOpen(false)} aria-label="Paistar 工具台，返回首页"><span className="brand-mark"><span className="relative z-10 text-lg font-bold tracking-[-.1em]">P</span></span><span className="text-[15px] font-bold tracking-[-.045em]">Paistar<span className="ml-1.5 text-xs font-medium text-muted-foreground">/ tools</span></span></Link>
      <nav className="hidden flex-1 items-center justify-center gap-10 md:flex" aria-label="主导航">{links.map((link) => <Link className={`nav-link ${pathname === link.href ? "active" : ""}`} key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      <div className="ml-auto flex items-center gap-1 md:ml-0"><Link href="/#find" className="icon-shell" title="搜索工具" aria-label="搜索工具"><Search size={19} strokeWidth={1.9} /></Link><button type="button" className="icon-shell" onClick={toggleTheme} title="切换白天或黑夜模式" aria-label="切换白天或黑夜模式"><Moon size={19} className="dark:hidden" strokeWidth={1.9}/><Sun size={19} className="hidden dark:block" strokeWidth={1.9}/></button><button type="button" className="icon-shell mobile-menu-button md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "关闭导航菜单" : "打开导航菜单"} aria-expanded={open} aria-controls="mobile-menu">{open ? <X size={20}/> : <Menu size={20}/>}</button></div>
    </div>
    {open && <nav id="mobile-menu" className="mobile-overlay glass md:hidden" aria-label="手机导航">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={16} className="ml-auto text-muted-foreground"/></Link>)}<Link href="/#find" onClick={() => setOpen(false)}>搜索工具<Search size={16} className="ml-auto text-muted-foreground"/></Link></nav>}
  </header>;
}
