import { describe, expect, it } from "vitest";
import { resolveTolerance } from "./tolerance.js";

const at = (value: string) => resolveTolerance(value, 620, 40);

describe("resolveTolerance", () => {
  it("reads the keywords", () => {
    expect(at("normal")).toBe(40);
    expect(at("")).toBe(40);
    expect(at("infinite")).toBe(Number.POSITIVE_INFINITY);
  });

  it("reads pixels and a percentage of the width", () => {
    expect(at("16px")).toBe(16);
    expect(at("5%")).toBe(31);
  });

  it("evaluates the math functions a computed value keeps", () => {
    expect(at("calc(5% + 10px)")).toBe(41);
    expect(at("calc(-10px + 5%)")).toBe(21);
    expect(at("min(10%, 40px)")).toBe(40);
    expect(at("max(5%, 10px)")).toBe(31);
    expect(at("clamp(0px, 10%, 40px)")).toBe(40);
    expect(at("calc(2 * min(5%, 40px))")).toBe(62);
  });

  it("falls back to normal for a negative length, and clamps a negative function to zero", () => {
    expect(at("-20px")).toBe(40);
    expect(at("calc(5% - 100px)")).toBe(0);
  });

  it("falls back to normal for what it cannot read", () => {
    expect(at("auto")).toBe(40);
    expect(at("calc(5% +")).toBe(40);
  });
});
