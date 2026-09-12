// Push to the Sites source repository using a short-lived credential supplied
// through stdin. The credential is never written to a file or Git config.
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
const reader = createInterface({ input: process.stdin });
const input = await new Promise((resolve) => reader.once("line", resolve));
reader.close();
process.stdin.pause();
const { remote_url, token, branch, auth_mode } = JSON.parse(input);
if (
  auth_mode !== "http_extra_header" ||
  !token ||
  !/^https:\/\//.test(remote_url) ||
  !/^[-\w/]+$/.test(branch)
)
  throw Error("Unsupported source credential.");
const result = spawnSync(
  "git",
  ["push", remote_url, `HEAD:refs/heads/${branch}`],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.extraHeader",
      GIT_CONFIG_VALUE_0: `Authorization: Bearer ${token}`,
    },
  },
);
for (const output of [result.stdout, result.stderr])
  if (output) process.stdout.write(output.split(token).join("[redacted]"));
if (result.error) console.error("Source push process failed.");
process.exit(result.status ?? 1);
