import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainMock } from './__test-utils__/createChainMock.js'
import {
  getDepth,
  getDescendantOrgIds,
  getSubtreeDepth,
  MAX_PARENT_WALK_ITERATIONS,
  validateHierarchy,
  walkParentChain,
} from './adminOrganizations.hierarchy.js'
import { OrgCycleDetectedException } from './exceptions/orgCycleDetected.exception.js'
import { OrgDepthExceededException } from './exceptions/orgDepthExceeded.exception.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(async (fn: (tx: Record<string, unknown>) => unknown) =>
      fn({
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })
    ),
  }
}

function createMockTx() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('admin-organizations.hierarchy', () => {
  let db: ReturnType<typeof createMockDb>

  beforeEach(() => {
    vi.restoreAllMocks()
    db = createMockDb()
  })

  // -------------------------------------------------------------------------
  // getDepth
  // -------------------------------------------------------------------------
  describe('getDepth', () => {
    it('should return 0 for a root org (parentOrganizationId is null)', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([{ parentOrganizationId: null }]))

      // Act
      const result = await getDepth(db as never, 'org-root')

      // Assert
      expect(result).toBe(0)
    })

    it('should return 1 for a direct child of a root org', async () => {
      // Arrange -- child points to parent, parent points to null
      db.select
        .mockReturnValueOnce(createChainMock([{ parentOrganizationId: 'org-parent' }]))
        .mockReturnValueOnce(createChainMock([{ parentOrganizationId: null }]))

      // Act
      const result = await getDepth(db as never, 'org-child')

      // Assert
      expect(result).toBe(1)
    })

    it('should return 2 for a grandchild org (child → parent → root)', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([{ parentOrganizationId: 'org-parent' }]))
        .mockReturnValueOnce(createChainMock([{ parentOrganizationId: 'org-root' }]))
        .mockReturnValueOnce(createChainMock([{ parentOrganizationId: null }]))

      // Act
      const result = await getDepth(db as never, 'org-grandchild')

      // Assert
      expect(result).toBe(2)
    })

    it('should stop and return depth when MAX_PARENT_WALK_ITERATIONS is reached', async () => {
      // Arrange -- each org always points to next parent (simulate deep chain exceeding cap)
      for (let i = 0; i <= MAX_PARENT_WALK_ITERATIONS + 2; i++) {
        db.select.mockReturnValueOnce(createChainMock([{ parentOrganizationId: `org-${i + 1}` }]))
      }

      // Act
      const result = await getDepth(db as never, 'org-0')

      // Assert -- should not exceed MAX_PARENT_WALK_ITERATIONS in depth
      expect(result).toBeLessThanOrEqual(MAX_PARENT_WALK_ITERATIONS)
    })

    it('should return 0 when org is not found in db', async () => {
      // Arrange -- query returns no row
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await getDepth(db as never, 'org-missing')

      // Assert
      expect(result).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // walkParentChain
  // -------------------------------------------------------------------------
  describe('walkParentChain', () => {
    it('should return depth 0 when startId has no parent', async () => {
      // Arrange
      const tx = createMockTx()
      tx.select.mockReturnValueOnce(
        createChainMock([{ id: 'org-start', parentOrganizationId: null }])
      )

      // Act
      const result = await walkParentChain(tx as never, 'org-target', 'org-start')

      // Assert
      expect(result.depth).toBe(0)
    })

    it('should return correct depth when walking a chain without cycles', async () => {
      // Arrange -- org-start → org-mid → null (no cycle against org-target)
      const tx = createMockTx()
      tx.select
        .mockReturnValueOnce(
          createChainMock([{ id: 'org-start', parentOrganizationId: 'org-mid' }])
        )
        .mockReturnValueOnce(createChainMock([{ id: 'org-mid', parentOrganizationId: null }]))

      // Act
      const result = await walkParentChain(tx as never, 'org-target', 'org-start')

      // Assert
      expect(result.depth).toBe(1)
    })

    it('should throw OrgCycleDetectedException when targetOrgId appears in the parent chain', async () => {
      // Arrange -- chain: org-start → org-target (cycle detected)
      const tx = createMockTx()
      tx.select.mockReturnValueOnce(
        createChainMock([{ id: 'org-start', parentOrganizationId: 'org-target' }])
      )

      // Act & Assert
      await expect(walkParentChain(tx as never, 'org-target', 'org-start')).rejects.toThrow(
        OrgCycleDetectedException
      )
    })

    it('should throw OrgCycleDetectedException when targetOrgId is deeper in the chain', async () => {
      // Arrange -- chain: org-start → org-mid → org-target (cycle detected 2 hops away)
      const tx = createMockTx()
      tx.select
        .mockReturnValueOnce(
          createChainMock([{ id: 'org-start', parentOrganizationId: 'org-mid' }])
        )
        .mockReturnValueOnce(
          createChainMock([{ id: 'org-mid', parentOrganizationId: 'org-target' }])
        )

      // Act & Assert
      await expect(walkParentChain(tx as never, 'org-target', 'org-start')).rejects.toThrow(
        OrgCycleDetectedException
      )
    })

    it('should stop at MAX_PARENT_WALK_ITERATIONS without throwing for a non-cycling deep chain', async () => {
      // Arrange -- long chain that never circles back to target
      const tx = createMockTx()
      for (let i = 0; i <= MAX_PARENT_WALK_ITERATIONS + 2; i++) {
        tx.select.mockReturnValueOnce(
          createChainMock([{ id: `org-${i}`, parentOrganizationId: `org-${i + 1}` }])
        )
      }

      // Act -- should not throw, should resolve with a depth
      const result = await walkParentChain(tx as never, 'org-never', 'org-0')

      // Assert
      expect(result.depth).toBeLessThanOrEqual(MAX_PARENT_WALK_ITERATIONS)
    })

    it('should return depth 0 when startId is not found in db', async () => {
      // Arrange
      const tx = createMockTx()
      tx.select.mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await walkParentChain(tx as never, 'org-target', 'org-missing')

      // Assert
      expect(result.depth).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // getSubtreeDepth
  // -------------------------------------------------------------------------
  describe('getSubtreeDepth', () => {
    it('should return 0 for a leaf org with no children', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await getSubtreeDepth(db as never, 'org-leaf')

      // Assert
      expect(result).toBe(0)
    })

    it('should return 1 when org has direct children but no grandchildren', async () => {
      // Arrange -- parent has one child; child has no children
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'org-child' }]))
        .mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await getSubtreeDepth(db as never, 'org-parent')

      // Assert
      expect(result).toBe(1)
    })

    it('should return 2 for a parent → child → grandchild tree', async () => {
      // Arrange -- parent has one child; child has one grandchild; grandchild is leaf
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'org-child' }])) // parent's children
        .mockReturnValueOnce(createChainMock([{ id: 'org-grandchild' }])) // child's children
        .mockReturnValueOnce(createChainMock([])) // grandchild is leaf

      // Act
      const result = await getSubtreeDepth(db as never, 'org-parent')

      // Assert
      expect(result).toBe(2)
    })

    it('should return the maximum depth among multiple children branches', async () => {
      // Arrange -- parent has two children: shallow-child (leaf) and deep-child (has grandchild)
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'shallow-child' }, { id: 'deep-child' }])) // parent's children
        .mockReturnValueOnce(createChainMock([])) // shallow-child is leaf
        .mockReturnValueOnce(createChainMock([{ id: 'grandchild' }])) // deep-child's children
        .mockReturnValueOnce(createChainMock([])) // grandchild is leaf

      // Act
      const result = await getSubtreeDepth(db as never, 'org-parent')

      // Assert -- deepest path is parent → deep-child → grandchild = depth 2
      expect(result).toBe(2)
    })

    it('should stop processing siblings when maxChildDepth reaches MAX_PARENT_WALK_ITERATIONS', async () => {
      // Arrange -- a parent with two children: the first child has a subtree of depth
      // MAX_PARENT_WALK_ITERATIONS (triggering the sibling-loop cap), the second child
      // should be skipped due to the cap.
      // First child of root has depth MAX_PARENT_WALK_ITERATIONS - 1 in its subtree
      // (i.e., child → grandchild → ... → leaf at depth MAX_PARENT_WALK_ITERATIONS)

      // Root's direct children: two children
      db.select.mockReturnValueOnce(createChainMock([{ id: 'child-deep' }, { id: 'child-skip' }]))

      // child-deep's subtree: MAX_PARENT_WALK_ITERATIONS levels of nesting
      // Each level has one child except the last leaf
      for (let i = 0; i < MAX_PARENT_WALK_ITERATIONS; i++) {
        db.select.mockReturnValueOnce(createChainMock([{ id: `level-${i + 1}` }]))
      }
      // leaf at the bottom
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await getSubtreeDepth(db as never, 'org-root')

      // Assert -- child-skip was not processed because cap was hit after child-deep.
      // child-deep subtree depth = MAX_PARENT_WALK_ITERATIONS, so maxChildDepth becomes
      // MAX_PARENT_WALK_ITERATIONS + 1 (child-deep counted) which triggers the break.
      // child-skip select is never called, so db.select call count = 1 (root children)
      //   + MAX_PARENT_WALK_ITERATIONS (chain) + 1 (leaf) = MAX_PARENT_WALK_ITERATIONS + 2
      expect(db.select).toHaveBeenCalledTimes(MAX_PARENT_WALK_ITERATIONS + 2)
      // The returned depth accounts for the deep child only (child-skip skipped)
      expect(result).toBe(MAX_PARENT_WALK_ITERATIONS + 1)
    })
  })

  // -------------------------------------------------------------------------
  // getDescendantOrgIds
  // -------------------------------------------------------------------------
  describe('getDescendantOrgIds', () => {
    it('should return empty array when org has no children', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await getDescendantOrgIds(db as never, 'org-leaf')

      // Assert
      expect(result).toEqual([])
    })

    it('should return direct children ids when they have no children', async () => {
      // Arrange -- two direct children, both leaves
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'child-1' }, { id: 'child-2' }]))
        .mockReturnValueOnce(createChainMock([])) // child-1 children
        .mockReturnValueOnce(createChainMock([])) // child-2 children

      // Act
      const result = await getDescendantOrgIds(db as never, 'org-parent')

      // Assert
      expect(result).toEqual(['child-1', 'child-2'])
    })

    it('should return all descendants recursively (children and grandchildren)', async () => {
      // Arrange -- parent → child → grandchild
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'child-1' }])) // parent's children
        .mockReturnValueOnce(createChainMock([{ id: 'grandchild-1' }])) // child-1's children
        .mockReturnValueOnce(createChainMock([])) // grandchild-1 is leaf

      // Act
      const result = await getDescendantOrgIds(db as never, 'org-parent')

      // Assert
      expect(result).toEqual(['child-1', 'grandchild-1'])
    })

    it('should cap results at 1000 and not process additional siblings', async () => {
      // Arrange -- first child returns 999 grandchildren, then there's a second child
      // We can simulate this by having a first batch of 999 children (each a leaf)
      // then a second child would push count over 1000

      // Build 1000 direct children to simulate the safety cap
      const manyChildren = Array.from({ length: 1001 }, (_, i) => ({ id: `child-${i}` }))
      db.select.mockReturnValueOnce(createChainMock(manyChildren))
      // Respond with empty children for each of the 1000 (cap stops at 1000 total)
      for (let i = 0; i < 1001; i++) {
        db.select.mockReturnValueOnce(createChainMock([]))
      }

      // Act
      const result = await getDescendantOrgIds(db as never, 'org-parent')

      // Assert -- capped at 1000
      expect(result.length).toBeLessThanOrEqual(1000)
    })
  })

  // -------------------------------------------------------------------------
  // validateHierarchy
  // -------------------------------------------------------------------------
  describe('validateHierarchy', () => {
    it('should throw OrgCycleDetectedException when orgId equals newParentId (self-reference)', async () => {
      // Act & Assert -- no db calls needed, throws immediately
      await expect(validateHierarchy(db as never, 'org-1', 'org-1')).rejects.toThrow(
        OrgCycleDetectedException
      )
    })

    it('should throw OrgCycleDetectedException when newParentId is a descendant of orgId', async () => {
      // Arrange -- walk-up from newParent reveals orgId in chain
      const txSelect = vi.fn()
      // newParent's parent is orgId → cycle detected
      txSelect.mockReturnValueOnce(
        createChainMock([{ id: 'org-new-parent', parentOrganizationId: 'org-1' }])
      )
      db.transaction.mockImplementationOnce(async (fn: (tx: Record<string, unknown>) => unknown) =>
        fn({ select: txSelect, insert: vi.fn(), update: vi.fn(), delete: vi.fn() })
      )

      // Act & Assert
      await expect(validateHierarchy(db as never, 'org-1', 'org-new-parent')).rejects.toThrow(
        OrgCycleDetectedException
      )
    })

    it('should throw OrgDepthExceededException when resulting depth would be >= 3', async () => {
      // Arrange -- walk-up gives depth 2 from newParent; subtree of orgId is 0
      // depth(2) + 1 + subtreeDepth(0) = 3 >= 3 → throws
      const txSelect = vi.fn()
      txSelect
        .mockReturnValueOnce(
          createChainMock([{ id: 'org-new-parent', parentOrganizationId: 'org-mid' }])
        )
        .mockReturnValueOnce(createChainMock([{ id: 'org-mid', parentOrganizationId: 'org-root' }]))
        .mockReturnValueOnce(createChainMock([{ id: 'org-root', parentOrganizationId: null }]))
      db.transaction.mockImplementationOnce(async (fn: (tx: Record<string, unknown>) => unknown) =>
        fn({ select: txSelect, insert: vi.fn(), update: vi.fn(), delete: vi.fn() })
      )
      // getSubtreeDepth on orgId: no children
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(validateHierarchy(db as never, 'org-move', 'org-new-parent')).rejects.toThrow(
        OrgDepthExceededException
      )
    })

    it('should resolve successfully when hierarchy is valid (depth within limits)', async () => {
      // Arrange -- newParent is root (depth 0), orgId is a leaf (subtreeDepth 0)
      // depth(0) + 1 + subtreeDepth(0) = 1 < 3 → valid
      const txSelect = vi.fn()
      txSelect.mockReturnValueOnce(
        createChainMock([{ id: 'org-new-parent', parentOrganizationId: null }])
      )
      db.transaction.mockImplementationOnce(async (fn: (tx: Record<string, unknown>) => unknown) =>
        fn({ select: txSelect, insert: vi.fn(), update: vi.fn(), delete: vi.fn() })
      )
      // getSubtreeDepth on orgId: no children
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert -- should resolve without throwing
      await expect(
        validateHierarchy(db as never, 'org-child', 'org-new-parent')
      ).resolves.toBeUndefined()
    })

    it('should resolve successfully when depth + 1 + subtreeDepth is exactly 2 (boundary)', async () => {
      // Arrange -- newParent is at depth 1 (has one ancestor), orgId is leaf
      // depth(1) + 1 + subtreeDepth(0) = 2 < 3 → valid
      const txSelect = vi.fn()
      txSelect
        .mockReturnValueOnce(
          createChainMock([{ id: 'org-new-parent', parentOrganizationId: 'org-root' }])
        )
        .mockReturnValueOnce(createChainMock([{ id: 'org-root', parentOrganizationId: null }]))
      db.transaction.mockImplementationOnce(async (fn: (tx: Record<string, unknown>) => unknown) =>
        fn({ select: txSelect, insert: vi.fn(), update: vi.fn(), delete: vi.fn() })
      )
      // getSubtreeDepth on orgId: no children
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(
        validateHierarchy(db as never, 'org-leaf', 'org-new-parent')
      ).resolves.toBeUndefined()
    })

    it('should throw OrgDepthExceededException when orgId has deep subtree that pushes total >= 3', async () => {
      // Arrange -- newParent is root (depth 0), orgId has subtreeDepth 2
      // depth(0) + 1 + subtreeDepth(2) = 3 >= 3 → throws
      const txSelect = vi.fn()
      txSelect.mockReturnValueOnce(
        createChainMock([{ id: 'org-new-parent', parentOrganizationId: null }])
      )
      db.transaction.mockImplementationOnce(async (fn: (tx: Record<string, unknown>) => unknown) =>
        fn({ select: txSelect, insert: vi.fn(), update: vi.fn(), delete: vi.fn() })
      )
      // getSubtreeDepth: orgId → child → grandchild (depth 2)
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'child-1' }]))
        .mockReturnValueOnce(createChainMock([{ id: 'grandchild-1' }]))
        .mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(validateHierarchy(db as never, 'org-deep', 'org-new-parent')).rejects.toThrow(
        OrgDepthExceededException
      )
    })
  })
})
