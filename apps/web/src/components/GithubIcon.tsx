import { Button } from '@repo/ui'
import { Github } from 'lucide-react'
import { GITHUB_REPO_URL } from '@/lib/config'
import { m } from '@/paraglide/messages'

export function GithubIcon() {
  return (
    <Button variant="ghost" size="icon" asChild>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={m.github_label()}
      >
        <Github className="h-4 w-4" />
      </a>
    </Button>
  )
}
