import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  cn,
  FormMessage,
  Input,
  Label,
  OAuthButton,
  PasswordInput,
  TabsContent,
} from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'
import { OrDivider } from '../components/OrDivider'

export function UnverifiedEmailAlert({
  resendCooldown,
  resendLoading,
  onResend,
}: {
  resendCooldown: number
  resendLoading: boolean
  onResend: () => void
}) {
  return (
    <Alert variant="warning">
      <AlertDescription className="space-y-2 text-center">
        <p>{m.auth_login_email_not_verified_sent()}</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 underline"
          onClick={onResend}
          disabled={resendCooldown > 0 || resendLoading}
        >
          {resendCooldown > 0
            ? m.auth_resend_in({ seconds: String(resendCooldown) })
            : m.auth_resend_verification()}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function PasswordLoginForm({
  email,
  password,
  rememberMe,
  loading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
}: {
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onRememberMeChange: (v: boolean) => void
}) {
  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{m.auth_email()}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{m.auth_password()}</Label>
          <Link
            to="/reset-password"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            {m.auth_forgot_password()}
          </Link>
        </div>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPasswordChange(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => onRememberMeChange(checked === true)}
        />
        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
          {m.auth_remember_me()}
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? m.auth_signing_in() : m.auth_sign_in_button()}
      </Button>
    </form>
  )
}

export function OAuthSection({
  providers,
  loading,
  oauthLoading,
  onOAuth,
}: {
  providers: { google?: boolean; github?: boolean }
  loading: boolean
  oauthLoading: string | null
  onOAuth: (provider: 'google' | 'github') => void
}) {
  return (
    <>
      <OrDivider />
      <div
        className={cn(
          'grid gap-2',
          providers.google && providers.github ? 'grid-cols-2' : 'grid-cols-1'
        )}
      >
        {providers.google && (
          <OAuthButton
            provider="google"
            loading={oauthLoading === 'google'}
            disabled={loading || oauthLoading !== null}
            onClick={() => onOAuth('google')}
          >
            {m.auth_sign_in_with_google()}
          </OAuthButton>
        )}
        {providers.github && (
          <OAuthButton
            provider="github"
            loading={oauthLoading === 'github'}
            disabled={loading || oauthLoading !== null}
            onClick={() => onOAuth('github')}
          >
            {m.auth_sign_in_with_github()}
          </OAuthButton>
        )}
      </div>
    </>
  )
}

export function PasswordLoginTab({
  email,
  password,
  rememberMe,
  loading,
  oauthLoading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  hasOAuth,
  providers,
  onOAuth,
}: {
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  oauthLoading: string | null
  onSubmit: (e: React.FormEvent) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onRememberMeChange: (v: boolean) => void
  hasOAuth: boolean
  providers: { google?: boolean; github?: boolean }
  onOAuth: (provider: 'google' | 'github') => void
}) {
  return (
    <TabsContent value="password" className="space-y-6 pt-4">
      <PasswordLoginForm
        email={email}
        password={password}
        rememberMe={rememberMe}
        loading={loading}
        onSubmit={onSubmit}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onRememberMeChange={onRememberMeChange}
      />

      {hasOAuth && (
        <OAuthSection
          providers={providers}
          loading={loading}
          oauthLoading={oauthLoading}
          onOAuth={onOAuth}
        />
      )}
    </TabsContent>
  )
}

export function MagicLinkTab({
  magicLinkEmail,
  loading,
  onSubmit,
  onMagicLinkEmailChange,
}: {
  magicLinkEmail: string
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onMagicLinkEmailChange: (v: string) => void
}) {
  return (
    <TabsContent value="magic-link" className="space-y-6 pt-4">
      <form onSubmit={onSubmit} aria-busy={loading} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="magic-email">{m.auth_email()}</Label>
          <Input
            id="magic-email"
            type="email"
            placeholder={m.auth_magic_link_placeholder()}
            value={magicLinkEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onMagicLinkEmailChange(e.target.value)
            }
            required
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? m.auth_sending() : m.auth_send_magic_link()}
        </Button>
      </form>
    </TabsContent>
  )
}

export function LoginPageAlerts({
  emailNotVerified,
  resendCooldown,
  resendLoading,
  error,
  onResend,
}: {
  emailNotVerified: boolean
  resendCooldown: number
  resendLoading: boolean
  error: string
  onResend: () => void
}) {
  return (
    <>
      {emailNotVerified && (
        <UnverifiedEmailAlert
          resendCooldown={resendCooldown}
          resendLoading={resendLoading}
          onResend={onResend}
        />
      )}

      {error && (
        <FormMessage variant="error" className="justify-center">
          {error}
        </FormMessage>
      )}
    </>
  )
}
