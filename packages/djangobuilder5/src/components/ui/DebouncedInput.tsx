import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

/** Text input that commits after a pause (default 400ms) instead of on every
 * keystroke. Adopts an external value only while unfocused, so the snapshot
 * echo of a just-committed value can't clobber in-progress typing; cancels any
 * pending commit on unmount so it can't fire against a now-deleted document.
 *
 * With `validate`, a value that fails is not committed: the field goes into an
 * invalid state (red ring, `aria-invalid`, the message as its tooltip) and the
 * text stays put so it can be corrected. Rendering stays a single element so
 * the component remains a drop-in inside the editor's flex rows. */
export function DebouncedInput({
  value,
  onCommit,
  validate,
  delay = 400,
  className,
  ...props
}: {
  value: string;
  onCommit: (v: string) => void;
  validate?: (v: string) => string | null;
  delay?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [local, setLocal] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function commit(v: string) {
    const err = validate ? validate(v) : null;
    setError(err);
    if (!err) onCommit(v);
  }

  return (
    <Input
      {...props}
      className={cn(error && "border-red-500 focus-visible:ring-red-500/40", className)}
      aria-invalid={error ? true : undefined}
      title={error ?? props.title}
      value={local}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (error) setError(validate ? validate(v) : null);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(v), delay);
      }}
      onBlur={() => {
        focused.current = false;
        if (timer.current) clearTimeout(timer.current);
        commit(local);
      }}
    />
  );
}
