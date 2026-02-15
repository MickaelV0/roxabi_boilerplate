import type { BaseLayoutProps, LinkItemType } from 'fumadocs-ui/layouts/shared'
import { clientEnv } from './env.client.js'

export function baseOptions(): BaseLayoutProps {
  const links: LinkItemType[] = [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
  ]

  const githubUrl = clientEnv.VITE_GITHUB_REPO_URL
  if (githubUrl) {
    links.push({
      text: 'GitHub',
      url: githubUrl,
    })
  }

  return {
    nav: {
      title: 'Roxabi Boilerplate',
    },
    links,
  }
}
