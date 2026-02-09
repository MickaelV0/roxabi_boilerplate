declare module 'culori' {
  type ColorMode = string

  type Color = {
    mode: ColorMode
    [channel: string]: number | string | undefined
  }

  type RgbColor = {
    mode: 'rgb'
    r: number
    g: number
    b: number
    alpha?: number
  }

  type OklchColor = {
    mode: 'oklch'
    l: number
    c: number
    h?: number
    alpha?: number
  }

  export function parse(input: string): Color | undefined

  export function formatHex(color: Color | string): string

  export function converter(mode: 'oklch'): (color: Color | string) => OklchColor | undefined
  export function converter(mode: 'rgb'): (color: Color | string) => RgbColor | undefined
  export function converter(mode: string): (color: Color | string) => Color | undefined
}
