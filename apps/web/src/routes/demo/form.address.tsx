import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useAppForm } from '@/hooks/demo.form'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/demo/form/address')({
  component: AddressForm,
  head: () => ({
    meta: [{ title: `${m.demo_form_address_heading()} | Roxabi` }],
  }),
})

function AddressForm() {
  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      phone: '',
    },
    validators: {
      onBlur: ({ value }) => {
        const errors = {
          fields: {},
        } as {
          fields: Record<string, string>
        }
        if (value.fullName.trim().length === 0) {
          errors.fields.fullName = m.demo_form_address_name_required()
        }
        return errors
      },
    },
    onSubmit: () => {},
  })

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{m.demo_form_address_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_form_address_subtitle()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.demo_form_address_shipping()}</CardTitle>
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
              <form.AppField name="fullName">
                {(field) => <field.TextField label={m.demo_form_address_full_name()} />}
              </form.AppField>

              <form.AppField
                name="email"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return m.demo_form_address_email_required()
                    }
                    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                      return m.demo_form_address_email_invalid()
                    }
                    return undefined
                  },
                }}
              >
                {(field) => <field.TextField label={m.demo_form_address_email()} />}
              </form.AppField>

              <form.AppField
                name="address.street"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return m.demo_form_address_street_required()
                    }
                    return undefined
                  },
                }}
              >
                {(field) => <field.TextField label={m.demo_form_address_street()} />}
              </form.AppField>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <form.AppField
                  name="address.city"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return m.demo_form_address_city_required()
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label={m.demo_form_address_city()} />}
                </form.AppField>
                <form.AppField
                  name="address.state"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return m.demo_form_address_state_required()
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label={m.demo_form_address_state()} />}
                </form.AppField>
                <form.AppField
                  name="address.zipCode"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return m.demo_form_address_zip_required()
                      }
                      if (!/^\d{5}(-\d{4})?$/.test(value)) {
                        return m.demo_form_address_zip_invalid()
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label={m.demo_form_address_zip()} />}
                </form.AppField>
              </div>

              <form.AppField
                name="address.country"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return m.demo_form_address_country_required()
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <field.Select
                    label={m.demo_form_address_country()}
                    values={[
                      { label: 'United States', value: 'US' },
                      { label: 'Canada', value: 'CA' },
                      { label: 'United Kingdom', value: 'UK' },
                      { label: 'Australia', value: 'AU' },
                      { label: 'Germany', value: 'DE' },
                      { label: 'France', value: 'FR' },
                      { label: 'Japan', value: 'JP' },
                    ]}
                    placeholder={m.demo_form_address_select_country()}
                  />
                )}
              </form.AppField>

              <form.AppField
                name="phone"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return m.demo_form_address_phone_required()
                    }
                    if (!/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) {
                      return m.demo_form_address_phone_invalid()
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <field.TextField label={m.demo_form_address_phone()} placeholder="123-456-7890" />
                )}
              </form.AppField>

              <div className="flex justify-end">
                <form.AppForm>
                  <form.SubscribeButton label={m.demo_form_address_submit()} />
                </form.AppForm>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
