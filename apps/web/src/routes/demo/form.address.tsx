import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'

import { useAppForm } from '@/hooks/demo.form'

export const Route = createFileRoute('/demo/form/address')({
  component: AddressForm,
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
          errors.fields.fullName = 'Full name is required'
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
          <h1 className="text-3xl font-bold">Address Form</h1>
          <p className="mt-2 text-muted-foreground">
            Nested fields and validation with TanStack Form
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
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
                {(field) => <field.TextField label="Full Name" />}
              </form.AppField>

              <form.AppField
                name="email"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Email is required'
                    }
                    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                      return 'Invalid email address'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => <field.TextField label="Email" />}
              </form.AppField>

              <form.AppField
                name="address.street"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Street address is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => <field.TextField label="Street Address" />}
              </form.AppField>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <form.AppField
                  name="address.city"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return 'City is required'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label="City" />}
                </form.AppField>
                <form.AppField
                  name="address.state"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return 'State is required'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label="State" />}
                </form.AppField>
                <form.AppField
                  name="address.zipCode"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return 'Zip code is required'
                      }
                      if (!/^\d{5}(-\d{4})?$/.test(value)) {
                        return 'Invalid zip code format'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label="Zip Code" />}
                </form.AppField>
              </div>

              <form.AppField
                name="address.country"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Country is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <field.Select
                    label="Country"
                    values={[
                      { label: 'United States', value: 'US' },
                      { label: 'Canada', value: 'CA' },
                      { label: 'United Kingdom', value: 'UK' },
                      { label: 'Australia', value: 'AU' },
                      { label: 'Germany', value: 'DE' },
                      { label: 'France', value: 'FR' },
                      { label: 'Japan', value: 'JP' },
                    ]}
                    placeholder="Select a country"
                  />
                )}
              </form.AppField>

              <form.AppField
                name="phone"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Phone number is required'
                    }
                    if (!/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) {
                      return 'Invalid phone number format'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => <field.TextField label="Phone" placeholder="123-456-7890" />}
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
