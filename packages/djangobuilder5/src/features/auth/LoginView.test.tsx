import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
const hoisted = vi.hoisted(() => ({ signIn: vi.fn(), navigate: vi.fn() }));
const signIn = hoisted.signIn;
const navigate = hoisted.navigate;
vi.mock("@/domain/firestore/auth", () => ({ signIn: (...a: unknown[]) => hoisted.signIn(...a) }));
vi.mock("react-router-dom", async (orig) => ({ ...(await orig() as object), useNavigate: () => hoisted.navigate }));
import { LoginView } from "./LoginView";

test("submitting valid credentials signs in and navigates to /projects", async () => {
  signIn.mockResolvedValue({ uid: "u1" });
  render(<MemoryRouter><LoginView /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
  await userEvent.type(screen.getByLabelText("Password"), "pw123456");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  expect(signIn).toHaveBeenCalledWith("a@b.com", "pw123456");
  expect(navigate).toHaveBeenCalledWith("/projects");
});

test("a failed sign-in shows an error", async () => {
  signIn.mockRejectedValue(new Error("bad"));
  render(<MemoryRouter><LoginView /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
  await userEvent.type(screen.getByLabelText("Password"), "nope");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/wrong email or password/i);
});
