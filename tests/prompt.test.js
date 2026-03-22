import { describe, it, expect } from "vitest";
import { Readable, Writable } from "node:stream";
import { askInstallScope, formatWarning } from "../src/prompt.js";

function createMockInput(answer) {
  const input = new Readable({ read() {} });
  setTimeout(() => {
    input.push(answer + "\n");
    input.push(null);
  }, 10);
  return input;
}

function createMockOutput() {
  const chunks = [];
  const output = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk.toString());
      cb();
    },
  });
  output.getContent = () => chunks.join("");
  return output;
}

describe("askInstallScope()", () => {
  it("returns 'local' when user chooses 1", async () => {
    const input = createMockInput("1");
    const output = createMockOutput();
    const result = await askInstallScope({ input, output });
    expect(result).toBe("local");
  });

  it("returns 'global' when user chooses 2", async () => {
    const input = createMockInput("2");
    const output = createMockOutput();
    const result = await askInstallScope({ input, output });
    expect(result).toBe("global");
  });

  it("returns 'both' when user chooses 3", async () => {
    const input = createMockInput("3");
    const output = createMockOutput();
    const result = await askInstallScope({ input, output });
    expect(result).toBe("both");
  });

  it("displays the three options in the prompt", async () => {
    const input = createMockInput("1");
    const output = createMockOutput();
    await askInstallScope({ input, output });
    const content = output.getContent();
    expect(content).toContain("local");
    expect(content).toContain("global");
    expect(content).toContain("both");
  });

  it("defaults to 'global' for empty input", async () => {
    const input = createMockInput("");
    const output = createMockOutput();
    const result = await askInstallScope({ input, output });
    expect(result).toBe("global");
  });
});

describe("formatWarning()", () => {
  it("returns a warning mentioning local precedence", () => {
    const warning = formatWarning();
    expect(warning).toContain("local");
    expect(warning).toContain("precedence");
  });
});
