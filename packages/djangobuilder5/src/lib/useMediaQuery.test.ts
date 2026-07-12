import { renderHook, act } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

afterEach(() => vi.unstubAllGlobals());

function stubMatchMedia(initial: boolean) {
  let handler: (() => void) | null = null;
  const mql = {
    matches: initial,
    media: "",
    addEventListener: (_: string, cb: () => void) => (handler = cb),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => mql);
  return {
    setMatches(v: boolean) {
      mql.matches = v;
      handler?.();
    },
  };
}

test("returns the initial match and updates on change", () => {
  const ctl = stubMatchMedia(false);
  const { result } = renderHook(() => useMediaQuery("(min-width: 1536px)"));
  expect(result.current).toBe(false);
  act(() => ctl.setMatches(true));
  expect(result.current).toBe(true);
});
