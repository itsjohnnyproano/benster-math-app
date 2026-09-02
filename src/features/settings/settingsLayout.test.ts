import { describe, expect, it } from "vitest";
import { getSettingsLayout } from "./settingsLayout";

describe("Settings layout", () => {
  it("keeps phones and portrait tablets in one column", () => {
    expect(getSettingsLayout(false, 393, 852, 1).twoColumn).toBe(false);
    expect(getSettingsLayout(false, 1100, 800, 1).twoColumn).toBe(false);
    expect(getSettingsLayout(true, 768, 1024, 1)).toEqual({ twoColumn: false, maxWidth: 760 });
  });
  it("uses two columns on wide landscape iPads", () => {
    expect(getSettingsLayout(true, 1024, 768, 1)).toEqual({ twoColumn: true, maxWidth: 1120 });
    expect(getSettingsLayout(true, 1180, 820, 1.35).twoColumn).toBe(true);
  });
  it("reserves the gutter before deciding whether two readable columns fit", () => {
    expect(getSettingsLayout(true, 976, 744, 1.3).twoColumn).toBe(false);
    expect(getSettingsLayout(true, 980, 744, 1.3).twoColumn).toBe(true);
  });
  it("returns to one column for narrow windows or Larger Text", () => {
    expect(getSettingsLayout(true, 740, 700, 1).twoColumn).toBe(false);
    expect(getSettingsLayout(true, 1366, 1024, 2).twoColumn).toBe(false);
  });
});
