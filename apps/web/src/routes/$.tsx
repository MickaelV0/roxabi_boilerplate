import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  beforeLoad: () => {
    throw notFound()
  },
})
