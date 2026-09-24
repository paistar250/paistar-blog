import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, LockKeyhole } from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import { ToolWorkspace } from "@/components/tool-workspace";
import { getTool, tools } from "@/lib/tools";

export function generateStaticParams() { return tools.map((tool) => ({ slug: tool.id })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const tool = getTool(slug); return tool ? { title: tool.title, description: tool.description, alternates: { canonical: `/tools/${tool.id}/` } } : {}; }

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const related = tools.filter((item) => item.id !== tool.id).slice(0, 3);
  return <div className="container-wide pt-15 md:pt-20"><Link href="/#find" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft size={15}/> 返回工具台</Link><div className="mt-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-5 flex items-center gap-3"><ToolIcon tool={tool}/><span className="eyebrow text-primary">{tool.categoryLabel} / TOOL {tool.marker}</span></div><h1 className="section-heading !text-[42px] md:!text-[56px]">{tool.title}</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{tool.description}</p></div><div className="flex shrink-0 items-center gap-2 text-[12px] text-muted-foreground"><LockKeyhole size={15}/> 本地处理 · 无需上传</div></div><section className="surface-panel mt-10 p-5 md:p-8" aria-label={`${tool.title}操作区`}><ToolWorkspace toolId={tool.id}/></section><div className="mt-10 grid gap-6 border-t border-border pt-9 md:grid-cols-[1fr_1fr]"><div><p className="eyebrow text-primary">DESIGNED TO HELP</p><h2 className="mt-3 text-[22px] font-bold tracking-[-.04em]">用起来刚刚好</h2><p className="mt-3 max-w-lg text-[13px] leading-7 text-muted-foreground">工具在浏览器里运行。输入、转换结果和生成的文件都不会由本站保存，也不需要账号。</p></div><ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">{tool.benefits.map((benefit) => <li key={benefit} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[12px] font-semibold"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"/>{benefit}</li>)}</ul></div><section className="mt-22"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow text-primary">KEEP EXPLORING</p><h2 className="section-heading mt-3">再试试这些</h2></div><Link href="/#find" className="hidden items-center gap-1 text-[13px] font-semibold text-primary sm:flex">全部工具 <ArrowUpRight size={15}/></Link></div><div className="grid gap-3 md:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/tools/${item.id}/`} className="surface-panel flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lg"><ToolIcon tool={item} size={21}/><div><p className="text-[14px] font-bold">{item.title}</p><p className="mt-1 text-[12px] text-muted-foreground">{item.short}</p></div><ArrowUpRight size={16} className="ml-auto text-muted-foreground"/></Link>)}</div></section></div>;
}
