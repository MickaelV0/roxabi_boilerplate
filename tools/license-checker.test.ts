import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkCompliance,
  detectLicense,
  isLicenseAllowed,
  type LicensePolicy,
  loadPolicy,
  parseSpdxExpression,
  scanDependencies,
  writeReport,
} from './license-checker'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let tmpDir: string

function createTmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'license-checker-test-'))
}

function writePkg(dir: string, pkg: Record<string, unknown>): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
}

// ─── Policy Loading ─────────────────────────────────────────────────────────

describe('policy loading', () => {
  beforeEach(() => {
    tmpDir = createTmpDir()
  })
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('loads a valid policy file', () => {
    writeFileSync(
      join(tmpDir, '.license-policy.json'),
      JSON.stringify({
        allowedLicenses: ['MIT', 'ISC'],
        overrides: { 'foo@1.0.0': 'MIT' },
      })
    )
    const policy = loadPolicy(tmpDir)
    expect(policy.allowedLicenses).toEqual(['MIT', 'ISC'])
    expect(policy.overrides).toEqual({ 'foo@1.0.0': 'MIT' })
  })

  it('throws when policy file is missing', () => {
    expect(() => loadPolicy(tmpDir)).toThrow('No .license-policy.json found at repo root')
  })

  it('handles empty allowedLicenses (strict mode)', () => {
    writeFileSync(
      join(tmpDir, '.license-policy.json'),
      JSON.stringify({
        allowedLicenses: [],
        overrides: {},
      })
    )
    const policy = loadPolicy(tmpDir)
    expect(policy.allowedLicenses).toEqual([])
  })
})

// ─── License Detection ──────────────────────────────────────────────────────

describe('license detection', () => {
  beforeEach(() => {
    tmpDir = createTmpDir()
  })
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  const basePolicy: LicensePolicy = { allowedLicenses: ['MIT'], overrides: {} }

  it('reads license from package.json license field', () => {
    const pkgDir = join(tmpDir, 'test-pkg')
    writePkg(pkgDir, { name: 'test-pkg', version: '1.0.0', license: 'MIT' })
    const result = detectLicense({ name: 'test-pkg', version: '1.0.0', dir: pkgDir }, basePolicy)
    expect(result).toEqual({ license: 'MIT', source: 'package.json' })
  })

  it('reads deprecated licenses array', () => {
    const pkgDir = join(tmpDir, 'old-pkg')
    writePkg(pkgDir, { name: 'old-pkg', version: '1.0.0', licenses: [{ type: 'BSD-3-Clause' }] })
    const result = detectLicense({ name: 'old-pkg', version: '1.0.0', dir: pkgDir }, basePolicy)
    expect(result).toEqual({ license: 'BSD-3-Clause', source: 'package.json' })
  })

  it('falls back to LICENSE file', () => {
    const pkgDir = join(tmpDir, 'file-pkg')
    writePkg(pkgDir, { name: 'file-pkg', version: '1.0.0' })
    writeFileSync(join(pkgDir, 'LICENSE'), 'MIT License\n\nPermission is hereby granted...')
    const result = detectLicense({ name: 'file-pkg', version: '1.0.0', dir: pkgDir }, basePolicy)
    expect(result).toEqual({ license: 'MIT', source: 'LICENSE file' })
  })

  it('override takes priority over package.json', () => {
    const pkgDir = join(tmpDir, 'override-pkg')
    writePkg(pkgDir, { name: 'override-pkg', version: '2.0.0', license: 'GPL-3.0' })
    const policy: LicensePolicy = {
      allowedLicenses: ['MIT'],
      overrides: { 'override-pkg@2.0.0': 'MIT' },
    }
    const result = detectLicense({ name: 'override-pkg', version: '2.0.0', dir: pkgDir }, policy)
    expect(result).toEqual({ license: 'MIT', source: 'override' })
  })

  it('returns unknown when no license found', () => {
    const pkgDir = join(tmpDir, 'no-license')
    writePkg(pkgDir, { name: 'no-license', version: '1.0.0' })
    const result = detectLicense({ name: 'no-license', version: '1.0.0', dir: pkgDir }, basePolicy)
    expect(result).toEqual({ license: null, source: null })
  })
})

// ─── SPDX Expression Handling ───────────────────────────────────────────────

describe('SPDX expression handling', () => {
  it('parses a simple license identifier', () => {
    expect(parseSpdxExpression('MIT')).toEqual(['MIT'])
  })

  it('parses OR expression', () => {
    expect(parseSpdxExpression('(MIT OR Apache-2.0)')).toEqual(['MIT', 'Apache-2.0'])
  })

  it('parses AND expression', () => {
    expect(parseSpdxExpression('MIT AND BSD-3-Clause')).toEqual(['MIT', 'BSD-3-Clause'])
  })

  it('allows if any component in OR expression is allowed', () => {
    expect(isLicenseAllowed('(MIT OR GPL-3.0)', ['MIT'])).toBe(true)
  })

  it('rejects if no component in OR expression is allowed', () => {
    expect(isLicenseAllowed('(GPL-3.0 OR AGPL-3.0)', ['MIT'])).toBe(false)
  })

  it('allows a direct match', () => {
    expect(isLicenseAllowed('MIT', ['MIT', 'ISC'])).toBe(true)
  })

  it('rejects AND expression when not all components are allowed', () => {
    expect(isLicenseAllowed('MIT AND GPL-3.0', ['MIT'])).toBe(false)
  })

  it('allows AND expression when all components are allowed', () => {
    expect(isLicenseAllowed('MIT AND ISC', ['MIT', 'ISC'])).toBe(true)
  })

  it('rejects parenthesized AND expression when not all components are allowed', () => {
    expect(isLicenseAllowed('(MIT AND GPL-3.0)', ['MIT'])).toBe(false)
  })

  it('allows parenthesized AND expression when all components are allowed', () => {
    expect(isLicenseAllowed('(MIT AND ISC)', ['MIT', 'ISC'])).toBe(true)
  })

  it('rejects null license', () => {
    expect(isLicenseAllowed(null, ['MIT'])).toBe(false)
  })
})

// ─── Compliance Check ───────────────────────────────────────────────────────

describe('compliance check', () => {
  beforeEach(() => {
    tmpDir = createTmpDir()
  })
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('marks allowed license as allowed', () => {
    const pkgDir = join(tmpDir, 'allowed-pkg')
    writePkg(pkgDir, { name: 'allowed-pkg', version: '1.0.0', license: 'MIT' })
    const policy: LicensePolicy = { allowedLicenses: ['MIT'], overrides: {} }
    const report = checkCompliance([{ name: 'allowed-pkg', version: '1.0.0', dir: pkgDir }], policy)
    expect(report.packages[0].status).toBe('allowed')
    expect(report.violations).toHaveLength(0)
  })

  it('marks disallowed license as violation', () => {
    const pkgDir = join(tmpDir, 'bad-pkg')
    writePkg(pkgDir, { name: 'bad-pkg', version: '1.0.0', license: 'GPL-3.0' })
    const policy: LicensePolicy = { allowedLicenses: ['MIT'], overrides: {} }
    const report = checkCompliance([{ name: 'bad-pkg', version: '1.0.0', dir: pkgDir }], policy)
    expect(report.packages[0].status).toBe('violation')
    expect(report.violations).toHaveLength(1)
  })

  it('marks unknown license as warning', () => {
    const pkgDir = join(tmpDir, 'unknown-pkg')
    writePkg(pkgDir, { name: 'unknown-pkg', version: '1.0.0' })
    const policy: LicensePolicy = { allowedLicenses: ['MIT'], overrides: {} }
    const report = checkCompliance([{ name: 'unknown-pkg', version: '1.0.0', dir: pkgDir }], policy)
    expect(report.packages[0].status).toBe('unknown')
    expect(report.warnings).toHaveLength(1)
  })

  it('marks override license as override', () => {
    const pkgDir = join(tmpDir, 'ov-pkg')
    writePkg(pkgDir, { name: 'ov-pkg', version: '1.0.0', license: 'GPL-3.0' })
    const policy: LicensePolicy = { allowedLicenses: ['MIT'], overrides: { 'ov-pkg@1.0.0': 'MIT' } }
    const report = checkCompliance([{ name: 'ov-pkg', version: '1.0.0', dir: pkgDir }], policy)
    expect(report.packages[0].status).toBe('override')
    expect(report.packages[0].license).toBe('MIT')
  })

  it('warns about stale overrides that match no installed package', () => {
    const pkgDir = join(tmpDir, 'real-pkg')
    writePkg(pkgDir, { name: 'real-pkg', version: '1.0.0', license: 'MIT' })
    const policy: LicensePolicy = {
      allowedLicenses: ['MIT'],
      overrides: { 'gone-pkg@2.0.0': 'MIT' },
    }
    const report = checkCompliance([{ name: 'real-pkg', version: '1.0.0', dir: pkgDir }], policy)
    expect(report.warnings).toHaveLength(1)
    expect(report.warnings[0].reason).toContain('gone-pkg@2.0.0')
  })
})

// ─── Scanning ───────────────────────────────────────────────────────────────

describe('scanning', () => {
  beforeEach(() => {
    tmpDir = createTmpDir()
  })
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('scans packages in node_modules', () => {
    const nm = join(tmpDir, 'node_modules')
    writePkg(join(nm, 'foo'), { name: 'foo', version: '1.0.0', license: 'MIT' })
    writePkg(join(nm, 'bar'), { name: 'bar', version: '2.0.0', license: 'ISC' })
    const pkgs = scanDependencies(tmpDir)
    expect(pkgs).toHaveLength(2)
    expect(pkgs.map((p) => p.name).sort()).toEqual(['bar', 'foo'])
  })

  it('scans scoped packages', () => {
    const nm = join(tmpDir, 'node_modules')
    writePkg(join(nm, '@org', 'pkg'), { name: '@org/pkg', version: '1.0.0', license: 'MIT' })
    const pkgs = scanDependencies(tmpDir)
    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].name).toBe('@org/pkg')
  })

  it('deduplicates packages by name@version', () => {
    const nm = join(tmpDir, 'node_modules')
    writePkg(join(nm, 'foo'), { name: 'foo', version: '1.0.0', license: 'MIT' })
    // Simulate workspace node_modules with same package
    mkdirSync(join(tmpDir, 'apps', 'web', 'node_modules', 'foo'), { recursive: true })
    writeFileSync(
      join(tmpDir, 'apps', 'web', 'node_modules', 'foo', 'package.json'),
      JSON.stringify({ name: 'foo', version: '1.0.0', license: 'MIT' })
    )
    const pkgs = scanDependencies(tmpDir)
    expect(pkgs.filter((p) => p.name === 'foo')).toHaveLength(1)
  })

  it('skips symlinked workspace packages', () => {
    const nm = join(tmpDir, 'node_modules')
    mkdirSync(nm, { recursive: true })
    // Create a real package dir and symlink it
    const realDir = join(tmpDir, 'packages', 'types')
    writePkg(realDir, { name: '@repo/types', version: '0.1.0' })
    mkdirSync(join(nm, '@repo'), { recursive: true })
    symlinkSync(realDir, join(nm, '@repo', 'types'), 'dir')
    // Also add a real dependency
    writePkg(join(nm, 'lodash'), { name: 'lodash', version: '4.0.0', license: 'MIT' })
    const pkgs = scanDependencies(tmpDir)
    expect(pkgs.map((p) => p.name)).not.toContain('@repo/types')
    expect(pkgs.map((p) => p.name)).toContain('lodash')
  })
})

// ─── Report Generation ──────────────────────────────────────────────────────

describe('report generation', () => {
  beforeEach(() => {
    tmpDir = createTmpDir()
  })
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes JSON report with correct structure', () => {
    const report = {
      timestamp: '2026-01-01T00:00:00.000Z',
      summary: { totalPackages: 1, licenses: { MIT: 1 }, violations: 0, warnings: 0 },
      packages: [
        {
          name: 'foo',
          version: '1.0.0',
          license: 'MIT',
          status: 'allowed' as const,
          source: 'package.json' as const,
        },
      ],
      violations: [],
      warnings: [],
    }
    const path = writeReport(report, tmpDir)
    expect(path).toContain('reports/licenses.json')
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    expect(written.summary.totalPackages).toBe(1)
    expect(written.packages).toHaveLength(1)
  })

  it('creates reports/ directory if missing', () => {
    const report = {
      timestamp: '2026-01-01T00:00:00.000Z',
      summary: { totalPackages: 0, licenses: {}, violations: 0, warnings: 0 },
      packages: [],
      violations: [],
      warnings: [],
    }
    const path = writeReport(report, tmpDir)
    expect(existsSync(path)).toBe(true)
  })
})
