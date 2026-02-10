import { Card, CardContent, CardHeader, CardTitle, Input } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'

import { fullName, store } from '@/lib/demo-store'

export const Route = createFileRoute('/demo/store')({
  component: DemoStore,
})

function FirstName() {
  const firstName = useStore(store, (state) => state.firstName)
  return (
    <Input
      type="text"
      value={firstName}
      onChange={(e) => store.setState((state) => ({ ...state, firstName: e.target.value }))}
      className="bg-muted/10 rounded-lg border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-muted-foreground/60 transition-colors duration-200 placeholder:text-muted-foreground/40"
    />
  )
}

function LastName() {
  const lastName = useStore(store, (state) => state.lastName)
  return (
    <Input
      type="text"
      value={lastName}
      onChange={(e) => store.setState((state) => ({ ...state, lastName: e.target.value }))}
      className="bg-muted/10 rounded-lg border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-muted-foreground/60 transition-colors duration-200 placeholder:text-muted-foreground/40"
    />
  )
}

function FullName() {
  const fName = useStore(fullName)
  return <div className="bg-muted/10 rounded-lg px-4 py-2 outline-none">{fName}</div>
}

function DemoStore() {
  return (
    <div
      className="min-h-[calc(100vh-32px)] text-foreground p-8 flex items-center justify-center w-full h-full"
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 80% 80%, #f4a460 0%, #8b4513 70%, #1a0f0a 100%)',
      }}
    >
      <Card className="backdrop-blur-lg bg-card/10 shadow-lg min-w-1/2">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">Store Example</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-3xl">
          <FirstName />
          <LastName />
          <FullName />
        </CardContent>
      </Card>
    </div>
  )
}
