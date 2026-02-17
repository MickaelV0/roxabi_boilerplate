import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Mermaid } from '@/components/mdx/mermaid'

/** MDX component map: Fumadocs defaults extended with custom components. */
// biome-ignore lint/suspicious/noExplicitAny: MDX component map requires flexible prop types for arbitrary custom components
type MdxComponents = typeof defaultMdxComponents & Record<string, React.ComponentType<any>>

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
