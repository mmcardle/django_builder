import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Debounced, word-wrapping, auto-growing single-logical-line editor for
 * argument strings. Renders a <textarea> so long values wrap into view, but
 * suppresses Enter and strips newlines so the value never breaks the generated
 * Python. Same commit/adopt semantics as DebouncedInput. */
export function DebouncedTextarea({
  value,
  onCommit,
  delay = 400,
  className,
  ...props
}: { value: string; onCommit: (v: string) => void; delay?: number } & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
>) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focused = useRef(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function grow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  useEffect(grow, [local]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <textarea
      ref={ref}
      rows={1}
      {...props}
      value={local}
      className={cn(
        "w-full resize-none overflow-hidden rounded-lg border border-border bg-bg px-3 py-1.5 font-mono text-sm text-text",
        "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
      onFocus={() => {
        focused.current = true;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/\n/g, "");
        setLocal(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(v), delay);
      }}
      onBlur={() => {
        focused.current = false;
        if (timer.current) clearTimeout(timer.current);
        onCommit(local);
      }}
    />
  );
}
