export type SchemaProperty = {
  type: string
  items?: { type: string; enum?: string[]; pattern?: string }
  minimum?: number
  maximum?: number
  default?: unknown
}

export type StyleSchema = {
  properties: Record<string, SchemaProperty>
}

export type OptionControlProps = {
  name: string
  prop: SchemaProperty
  value: unknown
  onChange: (name: string, value: unknown) => void
}

export type OptionsFormProps = {
  schema: StyleSchema
  options: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
}
