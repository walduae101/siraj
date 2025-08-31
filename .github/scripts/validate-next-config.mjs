import fs from "node:fs";

const file = "next.config.mjs";
if (!fs.existsSync(file)) {
  console.error(`❌ ${file} not found`);
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");

// Look for a headers() rule with source "/_next/static/:path*" and a Cache-Control
// value that includes public + max-age=31536000 + immutable (order/spacing agnostic).
const ruleRe =
  /source\s*:\s*["'`]\/_next\/static\/:path\*["'`][\s\S]{0,400}?headers\s*:\s*\[[\s\S]*?\{\s*key\s*:\s*["'`]cache-control["'`][\s\S]*?value\s*:\s*["'`][^"'`]*public[^"'`]*max-age\s*=\s*31536000[^"'`]*immutable[^"'`]*["'`]/i;

if (!ruleRe.test(src)) {
  console.error(
    "❌ Missing or incorrect immutable caching rule for /_next/static/:path* with Cache-Control: public, max-age=31536000, immutable"
  );
  console.error("Hint: Ensure next.config.mjs headers() includes the rule.");
  process.exit(1);
}

console.log("✅ next.config.mjs: immutable static header rule verified.");
process.exit(0);
