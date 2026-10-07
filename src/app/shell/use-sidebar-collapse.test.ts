import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The module under test does not exist yet — the import will fail until we
// implement it.
import { useSidebarCollapse } from "./use-sidebar-collapse";

const STORAGE_KEY = "cms-sidebar-collapsed";

describe("useSidebarCollapse", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults to expanded (collapsed = false)", () => {
    const { result } = renderHook(() => useSidebarCollapse());
    expect(result.current.collapsed).toBe(false);
  });

  it("toggles collapsed state", () => {
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => result.current.toggle());
    expect(result.current.collapsed).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.collapsed).toBe(false);
  });

  it("persists collapsed state to localStorage", () => {
    const { result } = renderHook(() => useSidebarCollapse());

    act(() => result.current.toggle());

    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("restores collapsed state from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "true");

    const { result } = renderHook(() => useSidebarCollapse());
    expect(result.current.collapsed).toBe(true);
  });

  it("falls back to expanded when localStorage value is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "garbage");

    const { result } = renderHook(() => useSidebarCollapse());
    expect(result.current.collapsed).toBe(false);
  });
});
