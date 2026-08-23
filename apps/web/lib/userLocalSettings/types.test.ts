import { describe, expect, test } from "vitest";

import { defaultUserLocalSettings, parseUserLocalSettings } from "./types";

describe("user local settings defaults", () => {
  test("defaults the interface language to simplified Chinese", () => {
    expect(defaultUserLocalSettings().lang).toBe("zh");
    expect(parseUserLocalSettings(undefined)?.lang).toBe("zh");
  });
});
