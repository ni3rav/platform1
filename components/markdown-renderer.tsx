"use client";

import { cn } from "@/lib/utils";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  let result = escapeHtml(text);

  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");

  // Strikethrough
  result = result.replace(/~~(.+?)~~/g, "<s>$1</s>");

  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">$1</a>',
  );

  return result;
}

function parseMarkdown(source: string): string {
  const lines = source.split("\n");
  const parts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      parts.push(
        `<h3 class="text-sm font-semibold text-foreground mt-3 mb-1">${renderInline(line.slice(4))}</h3>`,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      parts.push(
        `<h2 class="text-base font-semibold text-foreground mt-4 mb-1">${renderInline(line.slice(3))}</h2>`,
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      parts.push(
        `<h1 class="text-lg font-bold text-foreground mt-4 mb-2 text-pretty">${renderInline(line.slice(2))}</h1>`,
      );
      i++;
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].slice(2))}</li>`);
        i++;
      }
      parts.push(
        `<ul class="list-disc pl-5 my-1 space-y-0.5">${items.join("")}</ul>`,
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(
          `<li>${renderInline(lines[i].replace(/^\d+\. /, ""))}</li>`,
        );
        i++;
      }
      parts.push(
        `<ol class="list-decimal pl-5 my-1 space-y-0.5">${items.join("")}</ol>`,
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    parts.push(`<p class="my-1">${renderInline(line)}</p>`);
    i++;
  }

  return parts.join("");
}

interface MarkdownRendererProps extends React.ComponentProps<"div"> {
  content: string;
}

export function MarkdownRenderer({
  content,
  className,
  ...props
}: MarkdownRendererProps) {
  return (
    <div
      className={cn("text-sm leading-relaxed wrap-break-word", className)}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      {...props}
    />
  );
}
