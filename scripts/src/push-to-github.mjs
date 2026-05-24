import { execSync } from "node:child_process";

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN environment variable is not set");
  process.exit(1);
}

const repo = "https://pastaHouse525:TOKEN@github.com/pastaHouse525/wardan-online.git";
const remoteUrl = repo.replace("TOKEN", encodeURIComponent(token));

function run(cmd, opts = {}) {
  console.log(`> ${cmd.replace(token, "***")}`);
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...opts });
}

try {
  // Remove origin if it already exists
  try { run("git remote remove origin"); } catch {}

  // Add origin with token embedded
  run(`git remote add origin ${remoteUrl}`);

  // Push main branch
  const out = run("git push -u origin main --force");
  console.log(out);
  console.log("✓ Successfully pushed to GitHub!");
} catch (err) {
  // Sanitize token from error output
  const msg = (err.message || "").replace(new RegExp(token, "g"), "***");
  console.error("Push failed:", msg);
  if (err.stderr) console.error(err.stderr.replace(new RegExp(token, "g"), "***"));
  process.exit(1);
}
