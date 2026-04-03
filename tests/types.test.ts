import { describe, it, expect } from "vitest";
import { DEFAULT_PREFERENCES } from "@/lib/types";

describe("DEFAULT_PREFERENCES", () => {
  it("has the correct Frisco, TX search area", () => {
    expect(DEFAULT_PREFERENCES.searchArea).toBe("Frisco, TX");
  });

  it("has minBeds of 3", () => {
    expect(DEFAULT_PREFERENCES.minBeds).toBe(3);
  });

  it("has minBaths of 2", () => {
    expect(DEFAULT_PREFERENCES.minBaths).toBe(2);
  });

  it("has maxPrice of 650000", () => {
    expect(DEFAULT_PREFERENCES.maxPrice).toBe(650000);
  });

  it("has minSqft of 1800", () => {
    expect(DEFAULT_PREFERENCES.minSqft).toBe(1800);
  });

  it("has scoreThreshold of 6", () => {
    expect(DEFAULT_PREFERENCES.scoreThreshold).toBe(6);
  });

  it("has hotScoreThreshold of 8", () => {
    expect(DEFAULT_PREFERENCES.hotScoreThreshold).toBe(8);
  });

  it("hotScoreThreshold is greater than scoreThreshold", () => {
    expect(DEFAULT_PREFERENCES.hotScoreThreshold).toBeGreaterThan(
      DEFAULT_PREFERENCES.scoreThreshold
    );
  });

  it("maxHoa is null by default (no restriction)", () => {
    expect(DEFAULT_PREFERENCES.maxHoa).toBeNull();
  });

  it("has empty alertEmail by default", () => {
    expect(DEFAULT_PREFERENCES.alertEmail).toBe("");
  });
});
