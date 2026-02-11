import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { useAppForm } from '@/hooks/demo.form'

export const Route = createFileRoute('/demo/form/simple')({
  component: SimpleForm,
})

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
})

function SimpleForm() {
  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
    },
    validators: {
      onBlur: schema,
    },
    onSubmit: () => {},
  })

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Simple Form</h1>
          <p className="mt-2 text-muted-foreground">
            Basic form with TanStack Form and Zod validation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-6"
            >
              <form.AppField name="title">
                {(field) => <field.TextField label="Title" />}
              </form.AppField>

              <form.AppField name="description">
                {(field) => <field.TextArea label="Description" />}
              </form.AppField>

              <div className="flex justify-end">
                <form.AppForm>
                  <form.SubscribeButton label="Submit" />
                </form.AppForm>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
