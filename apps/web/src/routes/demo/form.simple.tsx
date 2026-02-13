import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useAppForm } from '@/hooks/demo.form'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/demo/form/simple')({
  component: SimpleForm,
  head: () => ({
    meta: [{ title: `${m.demo_form_simple_heading()} | Roxabi` }],
  }),
})

function SimpleForm() {
  const schema = z.object({
    title: z.string().min(1, m.demo_form_simple_title_required()),
    description: z.string().min(1, m.demo_form_simple_desc_required()),
  })

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
          <h1 className="text-3xl font-bold">{m.demo_form_simple_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_form_simple_subtitle()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.demo_form_simple_create()}</CardTitle>
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
                {(field) => <field.TextField label={m.demo_form_simple_field_title()} />}
              </form.AppField>

              <form.AppField name="description">
                {(field) => <field.TextArea label={m.demo_form_simple_field_desc()} />}
              </form.AppField>

              <div className="flex justify-end">
                <form.AppForm>
                  <form.SubscribeButton label={m.demo_form_simple_submit()} />
                </form.AppForm>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
