import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: vi.fn(() => ({
    handler: vi.fn((fn) => fn),
  })),
}))

describe('demo.punk-songs', () => {
  it('should export getPunkSongs as a function', async () => {
    const { getPunkSongs } = await import('./demo.punk-songs')

    expect(getPunkSongs).toBeDefined()
    expect(typeof getPunkSongs).toBe('function')
  })

  it('should return the list of punk songs', async () => {
    const { getPunkSongs } = await import('./demo.punk-songs')

    const songs = await getPunkSongs()

    expect(songs).toHaveLength(7)
    expect(songs[0]).toEqual({ id: 1, name: 'Teenage Dirtbag', artist: 'Wheatus' })
    expect(songs[5]).toEqual({ id: 6, name: 'All the Small Things', artist: 'blink-182' })
  })

  it('should return songs with correct shape', async () => {
    const { getPunkSongs } = await import('./demo.punk-songs')

    const songs = await getPunkSongs()

    for (const song of songs) {
      expect(song).toHaveProperty('id')
      expect(song).toHaveProperty('name')
      expect(song).toHaveProperty('artist')
      expect(typeof song.id).toBe('number')
      expect(typeof song.name).toBe('string')
      expect(typeof song.artist).toBe('string')
    }
  })
})
