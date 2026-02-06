import { Button } from '@repo/ui'
import { Github } from 'lucide-react'

export function GithubIcon() {
  return (
    <Button variant="ghost" size="icon" asChild>
      <a
        href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <Github className="h-4 w-4" />
      </a>
    </Button>
  )
}
