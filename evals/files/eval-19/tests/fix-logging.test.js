import { describe, it, expect } from "vitest";
// BROKEN: src/logger.js does not exist yet — this import fails to resolve
import { createLogger } from "../src/logger.js";
import { captureStdout } from "./helpers/capture.js"; // BROKEN: helper module missing

describe("logger levels", () => {
  it("prints info messages at normal level", () => {
    const log = createLogger("normal");
    const out = captureStdout(() => log.info("hello"));
    expect(out).toContain("hello");
  });

  it("suppresses info messages at quiet level", () => {
    const log = createLogger("quiet");
    const out = captureStdout(() => log.info("hello"));
    expect(out).toBe("");
  });
});
