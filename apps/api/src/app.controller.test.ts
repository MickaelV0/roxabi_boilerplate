import { describe, expect, it } from 'vitest'
import { AppController } from './app.controller.js'

describe('AppController', () => {
  const controller = new AppController()

  describe('getHealth', () => {
    it('should return status ok', () => {
      const result = controller.getHealth()
      expect(result).toEqual({ status: 'ok' })
    })
  })
})
