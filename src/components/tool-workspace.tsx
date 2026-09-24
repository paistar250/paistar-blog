"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, Clipboard, Download, RefreshCcw, Sparkles, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { diffLines } from "diff";
import { Button } from "@/components/ui/button";
import { formatJson, encodeBase64, decodeBase64, convertTimestamp } from "@/lib/transform";
import type { ToolId } from "@/lib/tools";

function CopyButton({ value, label = "复制结果" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <Button type="button" variant="outline" disabled={!value} onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); } }}><span className="inline-flex items-center gap-2">{copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "已复制" : label}</span></Button>;
}

function PanelTitle({ title, note }: { title: string; note?: string }) { return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[13px] font-bold">{title}</h2>{note && <span className="text-[11px] text-muted-foreground">{note}</span>}</div>; }
function ErrorNote({ error }: { error: string }) { return error ? <p role="alert" className="mt-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-[13px] text-destructive">{error}</p> : null; }

function JsonTool() {
  const [input, setInput] = useState('{\n  "name": "Paistar",\n  "tools": ["JSON", "QR Code"]\n}');
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const run = (compact: boolean) => { try { if (!input.trim()) throw new Error("请先输入 JSON 内容。"); setOutput(formatJson(input, compact)); setError(""); } catch (reason) { setOutput(""); setError(reason instanceof Error ? `JSON 解析失败：${reason.message}` : "JSON 解析失败。"); } };
  return <div><div className="grid gap-5 lg:grid-cols-2"><div><PanelTitle title="输入 JSON" note="内容只在浏览器中处理"/><textarea className="tool-textarea" aria-label="输入 JSON" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false}/></div><div><PanelTitle title="转换结果" note={output ? `${output.length} 个字符` : "等待处理"}/><textarea className="tool-textarea" aria-label="JSON 转换结果" value={output} readOnly placeholder="格式化后的内容会显示在这里" spellCheck={false}/></div></div><ErrorNote error={error}/><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => run(false)}><Sparkles size={15}/> 格式化</Button><Button variant="secondary" onClick={() => run(true)}>压缩</Button><CopyButton value={output}/><Button variant="ghost" onClick={() => { setInput(""); setOutput(""); setError(""); }}><Trash2 size={15}/> 清空</Button></div></div>;
}

function TimestampTool() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof convertTimestamp> | null>(null);
  const run = (value: string) => { try { setResult(convertTimestamp(value)); setError(""); } catch (reason) { setResult(null); setError(reason instanceof Error ? reason.message : "转换失败。"); } };
  return <div><PanelTitle title="时间戳或日期" note="支持 10/13 位时间戳、ISO 日期"/><div className="flex flex-col gap-3 sm:flex-row"><input className="tool-input flex-1" aria-label="时间戳或日期" placeholder="例如 1750000000 或 2026-09-24T12:00:00Z" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") run(input); }}/><Button onClick={() => run(input)}>转换</Button><Button variant="outline" onClick={() => { const now = String(Date.now()); setInput(now); run(now); }}><RefreshCcw size={15}/> 使用现在</Button></div><ErrorNote error={error}/>{result && <div className="mt-7 grid gap-3 sm:grid-cols-2">{([ ["Unix 秒", result.seconds], ["Unix 毫秒", result.milliseconds], ["UTC / ISO 8601", result.utc], ["本地时间", result.local] ] as const).map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-background p-4"><p className="text-[12px] font-bold text-muted-foreground">{label}</p><div className="mt-3 flex items-start gap-3"><code className="min-w-0 flex-1 break-all text-[13px]">{value}</code><CopyButton value={value} label="复制"/></div></div>)}</div>}<p className="mt-5 text-[12px] leading-6 text-muted-foreground">纯数字会按位数自动识别秒或毫秒；日期字符串按浏览器所在时区或字符串中的时区信息解析。</p></div>;
}

function EncodingTool() {
  const [mode, setMode] = useState<"base64" | "url">("base64");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const run = (decode: boolean) => { try { if (!input) throw new Error("请先输入要转换的文本。"); const next = mode === "base64" ? (decode ? decodeBase64(input) : encodeBase64(input)) : (decode ? decodeURIComponent(input) : encodeURIComponent(input)); setOutput(next); setError(""); } catch (reason) { setOutput(""); setError(reason instanceof Error ? `转换失败：${reason.message}` : "转换失败，请检查输入内容。"); } };
  return <div><div className="mb-6 flex gap-2" role="tablist" aria-label="编码类型"><button role="tab" aria-selected={mode === "base64"} className={`chip-button ${mode === "base64" ? "selected" : ""}`} onClick={() => { setMode("base64"); setOutput(""); setError(""); }}>Base64</button><button role="tab" aria-selected={mode === "url"} className={`chip-button ${mode === "url" ? "selected" : ""}`} onClick={() => { setMode("url"); setOutput(""); setError(""); }}>URL 组件</button></div><div className="grid gap-5 lg:grid-cols-2"><div><PanelTitle title="原始内容" note="支持中文与 Emoji"/><textarea className="tool-textarea" aria-label="待编解码文本" placeholder="输入文字或编码后的内容…" value={input} onChange={(event) => setInput(event.target.value)}/></div><div><PanelTitle title="转换结果"/><textarea className="tool-textarea" aria-label="编解码结果" readOnly value={output} placeholder="结果会显示在这里"/></div></div><ErrorNote error={error}/><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => run(false)}>编码</Button><Button variant="secondary" onClick={() => run(true)}>解码</Button><CopyButton value={output}/><Button variant="ghost" onClick={() => { setInput(""); setOutput(""); setError(""); }}><Trash2 size={15}/> 清空</Button></div><p className="mt-5 text-[12px] leading-6 text-muted-foreground">URL 模式处理单个 URL 组件；转换完整网址时请分别处理查询参数值。</p></div>;
}

function DiffTool() {
  const [left, setLeft] = useState("第一行\n旧内容\n最后一行");
  const [right, setRight] = useState("第一行\n新内容\n最后一行");
  const [compared, setCompared] = useState(false);
  const changes = useMemo(() => compared ? diffLines(left, right) : [], [left, right, compared]);
  const added = changes.filter((part) => part.added).reduce((total, part) => total + part.count, 0);
  const removed = changes.filter((part) => part.removed).reduce((total, part) => total + part.count, 0);
  return <div><div className="grid gap-5 lg:grid-cols-2"><div><PanelTitle title="原始文本"/><textarea className="tool-textarea" aria-label="原始文本" value={left} onChange={(event) => { setLeft(event.target.value); setCompared(false); }}/></div><div><PanelTitle title="修改后文本"/><textarea className="tool-textarea" aria-label="修改后文本" value={right} onChange={(event) => { setRight(event.target.value); setCompared(false); }}/></div></div><div className="mt-5 flex flex-wrap items-center gap-3"><Button onClick={() => setCompared(true)}>比较差异</Button><Button variant="outline" onClick={() => { setLeft(right); setCompared(false); }}>以右侧作为新起点</Button>{compared && <span className="text-[12px] text-muted-foreground">新增 {added} 行 · 删除 {removed} 行</span>}</div>{compared && <div className="mt-7"><PanelTitle title="逐行差异" note="绿色为新增，红色为删除"/><div className="max-h-[550px] overflow-auto rounded-2xl border border-border bg-background py-2 font-mono text-[12px] leading-7" aria-label="文本差异结果">{changes.length === 0 ? <p className="px-4 text-muted-foreground">两段文本都为空。</p> : changes.map((part, index) => <div key={index} className={`${part.added ? "diff-add" : part.removed ? "diff-remove" : ""} flex min-w-max px-4`}><span className="mr-4 select-none opacity-60">{part.added ? "+" : part.removed ? "−" : " "}</span><pre className="whitespace-pre-wrap break-all">{part.value}</pre></div>)}</div></div>}</div>;
}

function QrTool() {
  const [input, setInput] = useState("https://paistar.eu.cc/");
  const [size, setSize] = useState(360);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const generate = async () => { try { if (!input.trim()) throw new Error("请先输入文字或链接。"); const data = await QRCode.toDataURL(input, { width: size, margin: 2, errorCorrectionLevel: "M", color: { dark: "#222936", light: "#ffffff" } }); setImage(data); setError(""); } catch (reason) { setImage(""); setError(reason instanceof Error ? reason.message : "生成失败，请检查输入内容。"); } };
  useEffect(() => { void QRCode.toDataURL("https://paistar.eu.cc/", { width: 360, margin: 2, errorCorrectionLevel: "M", color: { dark: "#222936", light: "#ffffff" } }).then(setImage); }, []);
  return <div className="grid gap-8 lg:grid-cols-[1fr_330px]"><div><PanelTitle title="要分享的内容" note="链接、文字都可以"/><textarea className="tool-textarea min-h-[150px]" aria-label="二维码内容" value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入链接或文字…"/><div className="mt-5 flex items-center gap-3"><label htmlFor="qr-size" className="text-[13px] font-semibold">图片尺寸</label><select id="qr-size" className="tool-input max-w-[155px]" value={size} onChange={(event) => setSize(Number(event.target.value))}><option value={256}>256 × 256</option><option value={360}>360 × 360</option><option value={512}>512 × 512</option></select></div><ErrorNote error={error}/><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => void generate()}>生成二维码</Button>{image && <a href={image} download="paistar-qr.png" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-[14px] font-medium hover:bg-secondary"><Download size={15}/> 下载 PNG</a>}</div><p className="mt-5 text-[12px] leading-6 text-muted-foreground">二维码在此设备上生成，输入内容不会发送到服务器。下载后可直接分享。</p></div><div className="flex min-h-[330px] items-center justify-center rounded-[22px] border border-border bg-[#f0f0ed] p-7 dark:bg-[#242832]">{image ? <Image unoptimized src={image} alt={`二维码：${input.slice(0, 60)}`} width={size} height={size} className="w-full max-w-[270px] rounded-xl bg-white p-3 shadow-lg"/> : <span className="text-sm text-muted-foreground">等待生成</span>}</div></div>;
}

export function ToolWorkspace({ toolId }: { toolId: ToolId }) {
  switch (toolId) { case "json": return <JsonTool/>; case "timestamp": return <TimestampTool/>; case "base64": return <EncodingTool/>; case "diff": return <DiffTool/>; case "qr": return <QrTool/>; }
}
