import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import django from "highlight.js/lib/languages/django";

hljs.registerLanguage("python", python);
hljs.registerLanguage("django", django);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function langForFile(name: string): "python" | "django" | "plaintext" {
  if (name.endsWith(".py")) return "python";
  if (name.endsWith(".html")) return "django";
  return "plaintext";
}

export function highlight(code: string, lang: string): string {
  if (lang === "python" || lang === "django") {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      return escapeHtml(code);
    }
  }
  return escapeHtml(code);
}
