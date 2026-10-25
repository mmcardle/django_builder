import DjangoProject from "../src/api";
import Renderer from "../src/rendering";

const renderer = new Renderer();
const project = new DjangoProject("SecretTest");

function secretInArchive(bytes: Uint8Array): string {
  const match = Buffer.from(bytes).toString().match(/^SECRET_KEY = '([^']+)'/m);
  expect(match).not.toBeNull();
  return match![1];
}

test("each export gets a fresh Python-safe 256-bit secret without mutating the project", () => {
  const before = JSON.stringify(project);
  const first = secretInArchive(renderer.tarballContent(project));
  const second = secretInArchive(renderer.tarballContent(project));
  expect(first).toMatch(/^[a-f0-9]{64}$/);
  expect(second).toMatch(/^[a-f0-9]{64}$/);
  expect(first).not.toBe(second);
  expect(JSON.stringify(project)).toBe(before);
});

test("browser download URLs also contain a fresh secret per export", () => {
  const keys = [renderer.tarballURL(project), renderer.tarballURL(project)].map((url) =>
    secretInArchive(Buffer.from(url.split(",")[1], "base64"))
  );
  expect(keys[0]).toMatch(/^[a-f0-9]{64}$/);
  expect(keys[1]).not.toBe(keys[0]);
});

test("settings previews stay stable and explicitly identify their placeholder", () => {
  const before = renderer.renderProjectFile("settings.py", project);
  renderer.tarballContent(project);
  expect(renderer.renderProjectFile("settings.py", project)).toBe(before);
  expect(before).toContain("django-insecure-preview-only");
  expect(before).toContain("Preview only");
});

test("uses secure random bytes once per export and fails if they cannot be obtained", () => {
  const random = jest.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => {
    throw new Error("Secure randomness unavailable");
  });
  try {
    expect(() => renderer.tarballContent(project)).toThrow("Secure randomness unavailable");
    expect(random).toHaveBeenCalledTimes(1);
  } finally {
    random.mockRestore();
  }
});
