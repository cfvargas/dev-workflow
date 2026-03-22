import readline from "node:readline";

const OPTIONS = {
  1: "local",
  2: "global",
  3: "both",
};

export function askInstallScope({ input, output } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: input || process.stdin,
      output: output || process.stdout,
    });

    const prompt = [
      "Both local and global installations found.",
      "  1) local",
      "  2) global (default)",
      "  3) both",
      "Choose [1/2/3]: ",
    ].join("\n");

    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(OPTIONS[trimmed] || "global");
    });
  });
}

export function formatWarning() {
  return "Warning: local installation takes precedence over global.";
}
