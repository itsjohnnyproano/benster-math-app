import { describe, expect, it } from "vitest";
import appConfig from "../../app.json";

describe("web preview configuration", () => {
  it("uses client rendering to avoid the SDK 57 static-rendering SQLite worker failure", () => {
    expect(appConfig.expo.web.output).toBe("single");
  });
});
