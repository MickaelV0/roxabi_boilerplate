#!/usr/bin/env bun
/**
 * Demo GIF Recording Script
 *
 * Records a demo walkthrough of the app using Playwright's built-in
 * video recording, then converts the .webm output to an optimized GIF.
 *
 * Prerequisites:
 *   - @playwright/test (dev dependency): bun add -d @playwright/test && bunx playwright install chromium
 *   - ffmpeg: required for .webm → .gif conversion
 *   - gifsicle (optional): for further GIF optimization
 *
 * Run with: bun run scripts/record-demo.ts
 *
 * Environment variables:
 *   - APP_URL: Base URL of the running app (default: http://localhost:3000)
 *
 * Exit codes:
 *   - 0: Recording and conversion succeeded
 *   - 1: Missing dependency or runtime error
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const OUTPUT_DIR = join(ROOT, 'docs', 'assets')
const OUTPUT_GIF = join(OUTPUT_DIR, 'demo.gif')
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'

/** Milliseconds to pause between demo steps for visual clarity. */
const PAUSE = {
  short: 1000,
  medium: 2000,
} as const

// ---------------------------------------------------------------------------
// Dependency checks
// ---------------------------------------------------------------------------

async function checkAppRunning(): Promise<void> {
  try {
    const response = await fetch(APP_URL, { method: 'HEAD' })
    if (!response.ok) {
      throw new Error(`App responded with status ${response.status}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`ERROR: App is not running at ${APP_URL}`)
    console.error(`       ${message}`)
    console.error('')
    console.error('Start the app first:')
    console.error('  bun dev')
    process.exit(1)
  }
}

function checkFfmpeg(): void {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  } catch {
    console.error('ERROR: ffmpeg is not installed or not in PATH.')
    console.error('')
    console.error('Install ffmpeg:')
    console.error('  macOS:  brew install ffmpeg')
    console.error('  Ubuntu: sudo apt install ffmpeg')
    console.error('  Windows: winget install ffmpeg')
    process.exit(1)
  }
}

async function importPlaywright(): Promise<typeof import('@playwright/test')> {
  try {
    return await import('@playwright/test')
  } catch {
    console.error('ERROR: @playwright/test is not installed.')
    console.error('')
    console.error('Install it as a dev dependency:')
    console.error('  bun add -d @playwright/test')
    console.error('  bunx playwright install chromium')
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Recording helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function recordDemo(
  chromium: typeof import('@playwright/test')['chromium']
): Promise<string> {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: join(ROOT, '.tmp-recording'),
      size: { width: 1280, height: 720 },
    },
  })

  const page = await context.newPage()
  let videoPath: string | null = null

  try {
    console.log('  Step 1/6: Landing page')
    await page.goto(APP_URL)
    await sleep(PAUSE.medium)

    console.log('  Step 2/6: Click sign-up / get started')
    // Try common CTA selectors — adjust if the app uses different text
    const signupButton = page.getByRole('link', { name: /sign up|get started/i })
    await signupButton.click()
    await sleep(PAUSE.short)

    console.log('  Step 3/6: Fill signup form')
    await page.getByLabel(/email/i).fill('demo@roxabi.com')
    await page
      .getByLabel(/password/i)
      .first()
      .fill('DemoPassword123!')
    await page.getByRole('button', { name: /sign up|create account|register/i }).click()
    await sleep(PAUSE.medium)

    console.log('  Step 4/6: Dashboard loads')
    await page.waitForURL('**/dashboard**', { timeout: 10_000 }).catch(() => {
      // If the URL doesn't match, continue anyway — the video still captures what happened
      console.warn('  WARN: Dashboard URL pattern not detected, continuing...')
    })
    await sleep(PAUSE.medium)

    console.log('  Step 5/6: Open org switcher')
    const orgSwitcher = page.getByRole('button', { name: /organization|org|workspace|team/i })
    await orgSwitcher.click().catch(() => {
      console.warn('  WARN: Org switcher not found, skipping...')
    })
    await sleep(PAUSE.short)

    console.log('  Step 6/6: Switch organization')
    // Click the second org in the list (first non-active)
    const orgItems = page.getByRole('menuitem').or(page.getByRole('option'))
    const count = await orgItems.count()
    if (count > 1) {
      await orgItems.nth(1).click()
      await sleep(PAUSE.medium)
    } else {
      console.warn('  WARN: No alternative organization found, skipping switch...')
      await sleep(PAUSE.short)
    }
  } finally {
    // Capture video reference BEFORE closing the page (Playwright requirement)
    const video = page.video()
    videoPath = video ? await video.path() : null
    await page.close()
    await context.close()
    await browser.close()
  }

  if (!(videoPath && existsSync(videoPath))) {
    console.error('ERROR: Video file was not created by Playwright.')
    process.exit(1)
  }

  return videoPath
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

function convertToGif(webmPath: string): void {
  console.log(`\nConverting ${webmPath} to GIF...`)

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  try {
    execFileSync('ffmpeg', ['-y', '-i', webmPath, '-vf', 'fps=10,scale=1280:-1', OUTPUT_GIF], {
      stdio: 'inherit',
    })
    console.log(`GIF saved to ${OUTPUT_GIF}`)
  } catch {
    console.error('ERROR: ffmpeg conversion failed.')
    process.exit(1)
  }

  // Clean up the temporary recording
  try {
    unlinkSync(webmPath)
    const tmpDir = join(ROOT, '.tmp-recording')
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  } catch {
    console.warn('WARN: Could not clean up temporary recording files.')
  }
}

function suggestOptimization(): void {
  console.log('')
  console.log('Optional: optimize the GIF with gifsicle:')
  console.log(`  gifsicle --optimize=3 --colors=128 "${OUTPUT_GIF}" -o "${OUTPUT_GIF}"`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Recording demo walkthrough...\n')

  // Pre-flight checks
  await checkAppRunning()
  checkFfmpeg()
  const { chromium } = await importPlaywright()

  console.log(`App URL: ${APP_URL}\n`)

  // Record the demo
  const videoPath = await recordDemo(chromium)

  // Convert to GIF
  convertToGif(videoPath)

  // Suggest optional optimization
  suggestOptimization()

  console.log('\nDone!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
