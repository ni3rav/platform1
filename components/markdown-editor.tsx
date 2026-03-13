"use client";

import { useRef, useState, useCallback, useId } from "react";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface MarkdownEditorProps
  extends Omit<React.ComponentProps<"div">, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}

type FormatAction = {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: (textarea: HTMLTextAreaElement) => void;
};

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const replacement = `${before}${selected || "text"}${after}`;
  const newValue =
    value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);

  textarea.value = newValue;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));

  // Place cursor after the wrapped text
  const cursorPos = selectionStart + before.length + (selected.length || 4);
  textarea.setSelectionRange(cursorPos, cursorPos);
  textarea.focus();
}

function prefixCurrentLine(textarea: HTMLTextAreaElement, prefix: string) {
  const { selectionStart, selectionEnd, value } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd =
    selectionEnd < value.length ? value.indexOf("\n", selectionEnd) : -1;
  const safeLineEnd = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, safeLineEnd);
  const replacement = line.startsWith(prefix)
    ? line.slice(prefix.length)
    : `${prefix}${line}`;
  const newValue =
    value.slice(0, lineStart) + replacement + value.slice(safeLineEnd);

  textarea.value = newValue;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));

  const delta = replacement.length - line.length;
  textarea.setSelectionRange(selectionStart + delta, selectionEnd + delta);
  textarea.focus();
}

const FORMATS: FormatAction[] = [
  {
    id: "bold",
    icon: <strong className="text-xs font-bold">B</strong>,
    label: "Bold",
    shortcut: "Mod+B",
    action: (ta) => wrapSelection(ta, "**", "**"),
  },
  {
    id: "italic",
    icon: <em className="text-xs italic">I</em>,
    label: "Italic",
    shortcut: "Mod+I",
    action: (ta) => wrapSelection(ta, "*", "*"),
  },
  {
    id: "strike",
    icon: <s className="text-xs line-through">S</s>,
    label: "Strikethrough",
    action: (ta) => wrapSelection(ta, "~~", "~~"),
  },
  {
    id: "h1",
    icon: <span className="text-[10px] font-bold">H1</span>,
    label: "Heading 1",
    action: (ta) => prefixCurrentLine(ta, "# "),
  },
  {
    id: "h2",
    icon: <span className="text-[10px] font-bold">H2</span>,
    label: "Heading 2",
    action: (ta) => prefixCurrentLine(ta, "## "),
  },
  {
    id: "h3",
    icon: <span className="text-[10px] font-bold">H3</span>,
    label: "Heading 3",
    action: (ta) => prefixCurrentLine(ta, "### "),
  },
  {
    id: "ul",
    icon: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
    label: "Bulleted list",
    action: (ta) => prefixCurrentLine(ta, "- "),
  },
  {
    id: "ol",
    icon: (
      <span className="text-[10px] font-semibold leading-none">1.</span>
    ),
    label: "Numbered list",
    action: (ta) => prefixCurrentLine(ta, "1. "),
  },
  {
    id: "link",
    icon: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    label: "Link",
    shortcut: "Mod+K",
    action: (ta) => wrapSelection(ta, "[", "](url)"),
  },
];

const boldAction = FORMATS.find((format) => format.id === "bold")?.action;
const italicAction = FORMATS.find((format) => format.id === "italic")?.action;
const linkAction = FORMATS.find((format) => format.id === "link")?.action;

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write something…",
  rows = 5,
  id,
  className,
  ...props
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewId = useId();
  const toolbarId = useId();

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const applyAction = useCallback(
    (action: FormatAction["action"]) => {
      if (!textareaRef.current) return;
      action(textareaRef.current);
      onChange(textareaRef.current.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        if (boldAction) applyAction(boldAction);
      } else if (key === "i") {
        e.preventDefault();
        if (italicAction) applyAction(italicAction);
      } else if (key === "k") {
        e.preventDefault();
        if (linkAction) applyAction(linkAction);
      }
    },
    [applyAction],
  );

  return (
    <div className={cn("space-y-0", className)} {...props}>
      <div
        id={toolbarId}
        role="toolbar"
        aria-label="Editor formatting"
        className={cn(
          "flex items-center gap-1 rounded-t-md border border-b-0 border-input bg-muted/30 px-1.5 py-1",
        )}
      >
        {FORMATS.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            aria-label={fmt.label}
            title={fmt.shortcut ? `${fmt.label} (${fmt.shortcut})` : fmt.label}
            onClick={() => applyAction(fmt.action)}
            className={cn(
              "flex min-h-8 min-w-8 items-center justify-center rounded p-1.5",
              "text-muted-foreground transition-colors",
              "hover:text-foreground hover:bg-muted",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          >
            {fmt.icon}
          </button>
        ))}

        <div className="flex-1" />

        <button
          type="button"
          aria-pressed={showPreview}
          aria-controls={previewId}
          onClick={() => setShowPreview((v) => !v)}
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            showPreview
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {showPreview ? (
        <div
          id={previewId}
          role="region"
          aria-live="polite"
          className={cn(
            "rounded-b-md border border-input bg-background px-3 py-2",
            "min-h-24 text-sm text-foreground",
          )}
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-muted-foreground italic text-sm">
              Nothing to preview…
            </p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={id}
          rows={rows}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          aria-describedby={toolbarId}
          placeholder={placeholder}
          spellCheck={false}
          className={cn(
            "w-full resize-y rounded-b-md border border-input bg-background px-3 py-2",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "min-h-24 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        />
      )}
    </div>
  );
}
