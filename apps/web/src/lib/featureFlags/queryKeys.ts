export const featureFlagKeys = {
  all: ['feature-flags'] as const,
  list: () => [...featureFlagKeys.all, 'list'] as const,
} as const
