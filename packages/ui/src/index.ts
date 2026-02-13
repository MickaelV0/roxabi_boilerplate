// Components

export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './components/Accordion'
export { AnimatedSection } from './components/AnimatedSection'
export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './components/Avatar'
export { Badge, badgeVariants } from './components/Badge'
export { Button, buttonVariants } from './components/Button'
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
} from './components/Card'
export { Checkbox } from './components/Checkbox'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './components/Dialog'
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './components/DropdownMenu'
export { HoverCard, HoverCardContent, HoverCardTrigger } from './components/HoverCard'
export { Input } from './components/Input'
export { Label } from './components/Label'
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from './components/NavigationMenu'
export type { OAuthButtonProps, OAuthProvider } from './components/OAuthButton'
export { OAuthButton, oAuthButtonVariants } from './components/OAuthButton'
export type { PasswordInputProps, PasswordStrength } from './components/PasswordInput'
export { calculateStrength, PASSWORD_RULES, PasswordInput } from './components/PasswordInput'
export { PresentationNav } from './components/PresentationNav'
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './components/Select'
export { Separator } from './components/Separator'
export { Skeleton } from './components/Skeleton'
export { Slider } from './components/Slider'
export type { ToasterProps } from './components/Sonner'
export { Toaster } from './components/Sonner'
export { StatCounter } from './components/StatCounter'
export { Switch } from './components/Switch'
export { Textarea } from './components/Textarea'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/Tooltip'
// Hooks
export { useIntersectionVisibility } from './hooks/useIntersectionVisibility'
// Theme engine
export type {
  DerivedTheme,
  ThemeColors,
  ThemeConfig,
  ThemeShadows,
  ThemeTypography,
} from './lib/theme'
export {
  applyTheme,
  contrastRatio,
  deriveFullTheme,
  hexToOklch,
  meetsWcagAA,
  oklchToHex,
  resetTheme,
} from './lib/theme'
// Utilities
export { cn } from './lib/utils'

// Theme presets
export type { ShadcnPreset } from './themes/presets'
export {
  ALL_PRESETS,
  BASE_PRESETS,
  COLOR_PRESETS,
  getComposedConfig,
  getComposedDerivedTheme,
  getPresetConfig,
  getPresetDerivedTheme,
} from './themes/presets'
