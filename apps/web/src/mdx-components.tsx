import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Mermaid } from '@/components/mdx/mermaid'

/** MDX component map: Fumadocs defaults extended with custom components. */
type MdxComponents = typeof defaultMdxComponents & Record<string, React.ComponentType<never>>

/**
 * Returns the full set of MDX components used across docs pages.
 *
 * Merges Fumadocs defaults with custom components (e.g., Mermaid).
 * Accepts optional overrides for page-specific component customization.
 */
function getMDXComponents(components?: Partial<MdxComponents>): MdxComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    ...components,
  }
}

export { getMDXComponents }
