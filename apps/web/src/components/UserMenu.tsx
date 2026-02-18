import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut, Settings, Shield, User, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return (email?.[0] ?? '?').toUpperCase()
}

export function UserMenu() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  if (!session?.user) return null

  const { user } = session

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await authClient.signOut()
      navigate({ to: '/login' })
    } catch {
      toast.error(m.auth_toast_error())
      setSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={m.user_menu_label()}
        >
          <Avatar className="size-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user.name && <p className="text-sm font-medium leading-none">{user.name}</p>}
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings/profile">
            <User className="mr-2 size-4" />
            {m.user_menu_profile()}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings/account">
            <Shield className="mr-2 size-4" />
            {m.user_menu_account()}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {activeOrg && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/org/settings">
                <Settings className="mr-2 size-4" />
                {m.user_menu_org_settings()}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/org/members">
                <Users className="mr-2 size-4" />
                {m.user_menu_org_members()}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
          <LogOut className="mr-2 size-4" />
          {signingOut ? m.user_menu_signing_out() : m.user_menu_sign_out()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
