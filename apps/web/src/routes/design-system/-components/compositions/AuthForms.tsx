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
import { m } from '@/paraglide/messages'

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
          <CardTitle>{m.ds_auth_login()}</CardTitle>
          <CardDescription>{m.ds_auth_login_desc()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{m.ds_auth_email()}</Label>
            <Input id="login-email" type="email" placeholder={m.ds_auth_email_placeholder()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">{m.ds_auth_password()}</Label>
            <Input
              id="login-password"
              type="password"
              placeholder={m.ds_auth_password_placeholder()}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="login-remember" />
              <Label htmlFor="login-remember" className="text-sm font-normal">
                {m.ds_auth_remember_me()}
              </Label>
            </div>
            <button
              type="button"
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              {m.ds_auth_forgot_password()}
            </button>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">{m.ds_auth_sign_in()}</Button>
        </CardFooter>
      </Card>

      {/* Signup form */}
      <Card>
        <CardHeader>
          <CardTitle>{m.ds_auth_create_account()}</CardTitle>
          <CardDescription>{m.ds_auth_create_account_desc()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">{m.ds_auth_full_name()}</Label>
            <Input id="signup-name" type="text" placeholder={m.ds_auth_name_placeholder()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">{m.ds_auth_email()}</Label>
            <Input id="signup-email" type="email" placeholder={m.ds_auth_email_placeholder()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">{m.ds_auth_password()}</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder={m.ds_auth_create_password_placeholder()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm">{m.ds_auth_confirm_password()}</Label>
            <Input
              id="signup-confirm"
              type="password"
              placeholder={m.ds_auth_confirm_password_placeholder()}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="signup-terms" />
            <Label htmlFor="signup-terms" className="text-sm font-normal">
              {m.ds_auth_agree_terms()}
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">{m.ds_auth_create_account_button()}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
