import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/demo/form/steps')({
  component: StepsFormPage,
})

type FormData = {
  // Step 1: Personal Info
  firstName: string
  lastName: string
  email: string
  // Step 2: Company Info
  company: string
  role: string
  teamSize: string
  // Step 3: Preferences
  plan: string
  notifications: boolean
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  role: '',
  teamSize: '',
  plan: 'starter',
  notifications: true,
}

const steps = [
  { id: 1, name: 'Personal Info', description: 'Your basic information' },
  { id: 2, name: 'Company', description: 'Tell us about your company' },
  { id: 3, name: 'Preferences', description: 'Customize your experience' },
]

function StepsFormPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setCurrentStep(1)
    setIsSubmitted(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-lg px-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Thank You!</CardTitle>
              <CardDescription>Your form has been submitted successfully.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 text-left text-sm">
                <p>
                  <strong>Name:</strong> {formData.firstName} {formData.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email}
                </p>
                <p>
                  <strong>Company:</strong> {formData.company}
                </p>
                <p>
                  <strong>Role:</strong> {formData.role}
                </p>
                <p>
                  <strong>Plan:</strong> {formData.plan}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={resetForm} className="w-full">
                Start Over
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Get Started</h1>
          <p className="mt-2 text-muted-foreground">Complete the form to create your account</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                      currentStep > step.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : currentStep === step.id
                          ? 'border-primary text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {step.name}
                    </p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 flex-1 transition-colors ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.name}</CardTitle>
            <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Company Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc."
                    value={formData.company}
                    onChange={(e) => updateField('company', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Input
                    id="role"
                    placeholder="Software Engineer"
                    value={formData.role}
                    onChange={(e) => updateField('role', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    placeholder="10-50"
                    value={formData.teamSize}
                    onChange={(e) => updateField('teamSize', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Select a Plan</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {['starter', 'pro', 'enterprise'].map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => updateField('plan', plan)}
                        className={`rounded-lg border-2 p-4 text-center transition-colors ${
                          formData.plan === plan
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <p className="font-medium capitalize">{plan}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan === 'starter' && 'Free forever'}
                          {plan === 'pro' && '$19/month'}
                          {plan === 'enterprise' && 'Custom pricing'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your account
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.notifications}
                    onClick={() => updateField('notifications', !formData.notifications)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      formData.notifications ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        formData.notifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {currentStep === steps.length ? (
              <Button onClick={handleSubmit}>Submit</Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
