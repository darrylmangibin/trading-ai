import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const targets = {
  api: ["api"],
  web: ["web"],
  all: ["api", "web"],
};
const services = targets[process.argv[2]];

if (!services) {
  console.error("Choose api, web, or all.");
  process.exitCode = 2;
} else if (!existsSync(new URL("../compose.yaml", import.meta.url))) {
  console.error(
    "Docker Compose is not configured yet. Complete the Docker foundation tasks before rebuilding services.",
  );
  process.exitCode = 1;
} else {
  const commands = [
    ["compose", "build", "--no-cache", ...services],
    ["compose", "up", "-d", "--no-deps", "--force-recreate", ...services],
  ];

  for (const args of commands) {
    const result = spawnSync("docker", args, {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });

    if (result.error) {
      console.error("Docker could not be started. Check that Docker is installed and running.");
      process.exitCode = 1;
      break;
    }

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }
}
