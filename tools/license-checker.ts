/**
 * License Checker — Dependency License Compliance
 *
 * Scans all monorepo dependencies (direct and transitive) across workspace packages,
 * checks each license against a configurable allowlist, and produces a human-readable
 * CLI summary plus a machine-readable JSON report.
 *
 * Usage: bun run tools/license-checker.ts
 * Turbo: turbo run license:check
 *
 * Zero external dependencies — uses only Bun built-ins and Node.js fs/path.
 *
 * @see docs/specs/80-license-checker.mdx
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LicensePolicy {
  allowedLicenses: string[]
  overrides: Record<string, string>
}

export interface PackageEntry {
  name: string
  version: string
  license: string | null
  status: 'allowed' | 'violation' | 'unknown' | 'override'
  source: 'package.json' | 'LICENSE file' | 'override' | null
}

export interface LicenseReport {
  timestamp: string
  summary: {
    totalPackages: number
    licenses: Record<string, number>
    violations: number
    warnings: number
  }
  packages: PackageEntry[]
  violations: PackageEntry[]
  warnings: Array<{ name: string; version: string; reason: string }>
}

// ─── Policy Loading ──────────────────────────────────────────────────────────

// TODO: implement — load and validate license-policy.json from repo root

// ─── Node Modules Scanning ───────────────────────────────────────────────────

// TODO: implement — walk node_modules directories (root + workspace-specific)
// - Read each package.json for the license field
// - Deduplicate packages (same name@version counted once)
// - Skip symlinked workspace packages (project code, not third-party)

// ─── License Detection ──────────────────────────────────────────────────────

// TODO: implement — detect license for a package using priority order:
// 1. overrides in license-policy.json (highest priority)
// 2. license field in package.json (string)
// 3. licenses field in package.json (deprecated array — take first entry)
// 4. LICENSE / LICENCE / LICENSE.md / LICENCE.md file (identify via common patterns)
// 5. If none found → "unknown" with warning

// ─── SPDX Expression Handling ────────────────────────────────────────────────

// TODO: implement — parse SPDX expressions like "(MIT OR Apache-2.0)"
// - Check if ANY license in the expression is in the allowlist
// - If at least one is allowed, the package passes

// ─── Compliance Check ────────────────────────────────────────────────────────

// TODO: implement — compare each detected license against allowedLicenses array
// - Mark as "allowed", "violation", "unknown", or "override"

// ─── Report Generation ──────────────────────────────────────────────────────

// TODO: implement — generate JSON report to reports/licenses.json
// - Create reports/ directory if it doesn't exist

// ─── CLI Output ──────────────────────────────────────────────────────────────

// TODO: implement — print human-readable summary to stdout
// - License distribution table
// - Violations list (if any)
// - Warnings list (if any)

// ─── Main ────────────────────────────────────────────────────────────────────

// TODO: implement — orchestrate the full flow:
// 1. Validate node_modules exists
// 2. Load policy
// 3. Scan dependencies
// 4. Detect licenses
// 5. Check compliance
// 6. Generate report
// 7. Print CLI output
// 8. Exit with appropriate code (0 = clean, 1 = violations)
