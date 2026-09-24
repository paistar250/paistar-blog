export type ToolId = "json" | "timestamp" | "base64" | "diff" | "qr";
export type CategoryId = "all" | "data" | "text" | "create";

export type Tool = {
  id: ToolId;
  title: string;
  short: string;
  description: string;
  category: Exclude<CategoryId, "all">;
  categoryLabel: string;
  icon: "braces" | "clock" | "binary" | "split" | "qr";
  marker: string;
  tint: string;
  keywords: string[];
  benefits: string[];
};

export const categories: { id: CategoryId; label: string }[] = [
  { id: "all", label: "全部工具" },
  { id: "data", label: "数据处理" },
  { id: "text", label: "文本与编码" },
  { id: "create", label: "内容创作" },
];

export const tools: Tool[] = [
  { id: "json", title: "JSON 格式化", short: "让结构，一眼清楚。", description: "格式化、压缩与校验 JSON。错误位置直接提示，复制结果即可继续工作。", category: "data", categoryLabel: "数据处理", icon: "braces", marker: "01", tint: "lilac", keywords: ["json", "格式化", "压缩", "校验", "开发"], benefits: ["实时错误提示", "格式化与压缩", "一键复制"] },
  { id: "timestamp", title: "时间戳转换", short: "时间的另一种表达。", description: "在 Unix 时间戳、本地时间与 UTC 之间快速换算，自动识别秒和毫秒。", category: "data", categoryLabel: "数据处理", icon: "clock", marker: "02", tint: "mint", keywords: ["timestamp", "unix", "时间戳", "日期", "utc"], benefits: ["秒/毫秒自动识别", "本地与 UTC", "当前时间快捷填入"] },
  { id: "base64", title: "Base64 与 URL 编解码", short: "字符转换，不打结。", description: "支持中文与 Emoji 的 Base64 编解码，以及 URL 组件的安全编码和解码。", category: "text", categoryLabel: "文本与编码", icon: "binary", marker: "03", tint: "peach", keywords: ["base64", "url", "编码", "解码", "中文"], benefits: ["完整 Unicode 支持", "双向转换", "浏览器本地处理"] },
  { id: "diff", title: "文本对比", short: "让修改有迹可循。", description: "逐行比较两段文本，清楚标出新增、删除与未变化的内容。", category: "text", categoryLabel: "文本与编码", icon: "split", marker: "04", tint: "blue", keywords: ["diff", "对比", "文本", "差异", "比较"], benefits: ["逐行差异", "新增与删除统计", "长文本可滚动查看"] },
  { id: "qr", title: "二维码生成", short: "把链接，轻轻递出去。", description: "输入任意文字或链接，生成清晰的二维码并下载 PNG 图片。", category: "create", categoryLabel: "内容创作", icon: "qr", marker: "05", tint: "yellow", keywords: ["qr", "二维码", "生成", "下载", "链接"], benefits: ["自定义尺寸", "PNG 下载", "纯本地生成"] },
];

export function getTool(id: string) { return tools.find((tool) => tool.id === id); }
