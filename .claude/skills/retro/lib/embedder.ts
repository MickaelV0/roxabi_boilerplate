/**
 * Transformers.js wrapper for local embedding generation.
 *
 * Uses all-MiniLM-L6-v2 (384 dimensions) via @huggingface/transformers.
 * Model is cached at ~/.cache/huggingface/ (~45 MB on first download).
 */

import { existsSync } from 'node:fs'
import path from 'node:path'

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'
const EMBEDDING_DIM = 384

/** Singleton pipeline instance */
// biome-ignore lint/suspicious/noExplicitAny: Transformers.js pipeline type is complex and not easily typed
let pipeline: any = null

/**
 * Initialize the embedding pipeline (downloads model on first run).
 * Call during --setup to pre-download the model.
 */
export async function initEmbedder(): Promise<void> {
  if (pipeline) {
    return
  }
  const { pipeline: createPipeline } = await import('@huggingface/transformers')
  pipeline = await createPipeline('feature-extraction', MODEL_NAME, { dtype: 'fp32' })
}

/**
 * Generate an embedding vector for a text string.
 *
 * @param text - The text to embed
 * @returns Float32Array of EMBEDDING_DIM dimensions
 */
export async function embed(text: string): Promise<Float32Array> {
  if (pipeline === null) {
    throw new Error('Embedder not initialized. Call initEmbedder() first.')
  }
  const output = await pipeline(text, { pooling: 'mean', normalize: true })
  return new Float32Array(output.data)
}

/**
 * Check if the embedding model is already cached.
 */
export function isModelCached(): boolean {
  const cacheDir = path.join(
    process.env.HOME || '',
    '.cache',
    'huggingface',
    'hub',
    'models--Xenova--all-MiniLM-L6-v2'
  )
  return existsSync(cacheDir)
}

export { MODEL_NAME, EMBEDDING_DIM }
