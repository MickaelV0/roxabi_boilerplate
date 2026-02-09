import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from '@repo/ui'

/**
 * Auth form composition patterns.
 *
 * Renders two patterns:
 * 1. Login form -- email, password, remember me, submit button
 * 2. Signup form -- name, email, password, confirm password, terms checkbox, submit button
 *
 * Uses real @repo/ui components with realistic (but static) data.
 * Forms are non-functional (visual reference only).
 */
export function AuthForms() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Login form */}
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" placeholder="Enter your password" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="login-remember" />
              <Label htmlFor="login-remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
            <button
              type="button"
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Sign in</Button>
        </CardFooter>
      </Card>

      {/* Signup form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Get started with a free account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input id="signup-name" type="text" placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" type="password" placeholder="Create a password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Confirm password</Label>
            <Input id="signup-confirm" type="password" placeholder="Confirm your password" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="signup-terms" />
            <Label htmlFor="signup-terms" className="text-sm font-normal">
              I agree to the Terms of Service
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Create account</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
