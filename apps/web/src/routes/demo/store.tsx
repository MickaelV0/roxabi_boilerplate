import { Card, CardContent, CardHeader, CardTitle, Input } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { ChevronLeft } from 'lucide-react'

import { fullName, store } from '@/lib/demo-store'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/demo/store')({
  component: DemoStore,
  head: () => ({
    meta: [{ title: `${m.demo_store_title()} | Roxabi` }],
  }),
})

function FirstName() {
  const firstName = useStore(store, (state) => state.firstName)
  return (
    <Input
      type="text"
      aria-label={m.demo_store_first_name()}
      value={firstName}
      onChange={(e) => store.setState((state) => ({ ...state, firstName: e.target.value }))}
    />
  )
}

function LastName() {
  const lastName = useStore(store, (state) => state.lastName)
  return (
    <Input
      type="text"
      aria-label={m.demo_store_last_name()}
      value={lastName}
      onChange={(e) => store.setState((state) => ({ ...state, lastName: e.target.value }))}
    />
  )
}

function FullName() {
  const fName = useStore(fullName)
  return <div className="rounded-lg bg-muted px-4 py-2">{fName}</div>
}

function DemoStore() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link
          to="/demo"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          {m.demo_back_to_demos()}
        </Link>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{m.demo_store_title()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_store_desc()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.demo_store_example()}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FirstName />
            <LastName />
            <FullName />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
