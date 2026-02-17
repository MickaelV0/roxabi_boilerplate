/**
 * Transformers.js wrapper for local embedding generation.
 *
 * Uses all-MiniLM-L6-v2 (384 dimensions) via @huggingface/transformers.
 * Model is cached at ~/.cache/huggingface/ (~45 MB on first download).
 */

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'
const EMBEDDING_DIM = 384

/** Singleton pipeline instance */
const _pipeline: unknown | null = null

/**
 * Initialize the embedding pipeline (downloads model on first run).
 * Call during --setup to pre-download the model.
 */
export async function initEmbedder(): Promise<void> {
  // TODO: implement
  // 1. Import @huggingface/transformers
  // 2. Create feature-extraction pipeline with MODEL_NAME
  // 3. Store in singleton
  throw new Error('Not implemented')
}

/**
 * Generate an embedding vector for a text string.
 *
 * @param text - The text to embed
 * @returns Float32Array of EMBEDDING_DIM dimensions
 */
export async function embed(_text: string): Promise<Float32Array> {
  // TODO: implement
  // 1. Ensure pipeline is initialized
  // 2. Run pipeline on text
  // 3. Return Float32Array
  throw new Error('Not implemented')
}

/**
 * Check if the embedding model is already cached.
 */
export function isModelCached(): boolean {
  // TODO: implement
  // Check ~/.cache/huggingface/ for the model files
  throw new Error('Not implemented')
}

export { MODEL_NAME, EMBEDDING_DIM }
