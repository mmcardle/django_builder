import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";

/** Text input that commits after a pause (default 400ms) instead of on every
 * keystroke. Adopts an external value only while unfocused, so the snapshot
 * echo of a just-committed value can't clobber in-progress typing; cancels any
 * pending commit on unmount so it can't fire against a now-deleted document. */
export function DebouncedInput({
  value,
  onCommit,
  delay = 400,
  ...props
}: { value: string; onCommit: (v: string) => void; delay?: number } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  const [local, setLocal] = useState(value);
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

  return (
    <Input
      {...props}
      value={local}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const v = e.target.value;
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
