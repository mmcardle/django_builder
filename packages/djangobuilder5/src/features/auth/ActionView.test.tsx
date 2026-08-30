import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
const hoisted = vi.hoisted(() => ({ applyVerify: vi.fn() }));
const applyVerify = hoisted.applyVerify;
vi.mock("@/domain/firestore/auth", () => ({ applyVerify: (...a: unknown[]) => hoisted.applyVerify(...a), confirmReset: vi.fn() }));
import { ActionView } from "./ActionView";

test("verifyEmail mode applies the action code and confirms success", async () => {
  applyVerify.mockResolvedValue(undefined);
  render(<MemoryRouter initialEntries={["/action?mode=verifyEmail&oobCode=abc"]}><ActionView /></MemoryRouter>);
  expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
  expect(applyVerify).toHaveBeenCalledWith("abc");
});
