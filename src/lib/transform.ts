export function formatJson(input: string, compact = false): string {
  const value = JSON.parse(input);
  return JSON.stringify(value, null, compact ? undefined : 2);
}

export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeBase64(input: string): string {
  const binary = atob(input.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function convertTimestamp(input: string): { seconds: string; milliseconds: string; utc: string; local: string } {
  const value = input.trim();
  if (!value) throw new Error("请先输入时间戳或日期。");
  let milliseconds: number;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error("数字超出可用范围。");
    milliseconds = Math.abs(number) >= 1e11 ? number : number * 1000;
  } else {
    milliseconds = Date.parse(value);
  }
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new Error("无法识别日期，请使用时间戳或 ISO 日期格式。");
  return { seconds: String(Math.floor(milliseconds / 1000)), milliseconds: String(milliseconds), utc: date.toISOString(), local: new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short", hour12: false }).format(date) };
}
