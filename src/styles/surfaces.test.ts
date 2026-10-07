import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const scss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "_user.scss"),
  "utf8",
);

describe("list surface styles", () => {
  it("sticks the table header below the topbar on desktop", () => {
    expect(scss).toContain(".data-table thead th");
    expect(scss).toContain("top: 3.5rem");
    expect(scss).toContain("@media (min-width: 768px)");
  });

  it("paints hover and selected rows from the primary token", () => {
    expect(scss).toContain('tr[data-selected="true"]');
    expect(scss).toContain("var(--shopee-primary-soft)");
  });

  it("tints selected cards from the primary token", () => {
    expect(scss).toContain(".data-card[data-selected");
  });
});
