import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Slider,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui'
import { m } from '@/paraglide/messages'

import { ComponentShowcase } from './ComponentShowcase'

function InteractiveControlDemos() {
  return (
    <>
      <ComponentShowcase
        name="Button"
        category={m.ds_category_inputs()}
        propControls={[
          {
            name: 'variant',
            type: 'select',
            options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
            defaultValue: 'default',
          },
          {
            name: 'size',
            type: 'select',
            options: ['default', 'sm', 'lg', 'icon'],
            defaultValue: 'default',
          },
          { name: 'disabled', type: 'boolean', defaultValue: false },
        ]}
      >
        {(props) => (
          // TODO(#90): type preview props properly — ComponentShowcase children receive Record<string, unknown>
          <Button
            variant={props.variant as 'default'}
            size={props.size as 'default'}
            disabled={Boolean(props.disabled)}
          >
            {props.size === 'icon' ? 'A' : m.ds_demo_click_me()}
          </Button>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Input"
        category={m.ds_category_inputs()}
        propControls={[
          { name: 'placeholder', type: 'text', defaultValue: m.ds_demo_type_something() },
          { name: 'disabled', type: 'boolean', defaultValue: false },
        ]}
      >
        {(props) => (
          <Input
            placeholder={String(props.placeholder)}
            disabled={Boolean(props.disabled)}
            className="max-w-sm"
          />
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Textarea"
        category={m.ds_category_inputs()}
        propControls={[
          { name: 'placeholder', type: 'text', defaultValue: m.ds_demo_enter_message() },
          { name: 'disabled', type: 'boolean', defaultValue: false },
        ]}
      >
        {(props) => (
          <Textarea
            placeholder={String(props.placeholder)}
            disabled={Boolean(props.disabled)}
            className="max-w-sm"
          />
        )}
      </ComponentShowcase>
    </>
  )
}

function ToggleInputDemos() {
  return (
    <>
      <ComponentShowcase
        name="Checkbox"
        category={m.ds_category_inputs()}
        propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
      >
        {(props) => (
          <div className="flex items-center gap-2">
            <Checkbox id="demo-cb" disabled={Boolean(props.disabled)} />
            <Label htmlFor="demo-cb">{m.ds_demo_accept_terms()}</Label>
          </div>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Switch"
        category={m.ds_category_inputs()}
        propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
      >
        {(props) => (
          <div className="flex items-center gap-2">
            <Switch id="demo-sw" disabled={Boolean(props.disabled)} />
            <Label htmlFor="demo-sw">{m.ds_demo_airplane_mode()}</Label>
          </div>
        )}
      </ComponentShowcase>

      <ComponentShowcase name="Select" category={m.ds_category_inputs()} propControls={[]}>
        {() => (
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={m.ds_demo_pick_fruit()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">{m.ds_demo_apple()}</SelectItem>
              <SelectItem value="banana">{m.ds_demo_banana()}</SelectItem>
              <SelectItem value="cherry">{m.ds_demo_cherry()}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Slider"
        category={m.ds_category_inputs()}
        propControls={[{ name: 'disabled', type: 'boolean', defaultValue: false }]}
      >
        {(props) => (
          <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            disabled={Boolean(props.disabled)}
            className="max-w-sm"
          />
        )}
      </ComponentShowcase>
    </>
  )
}

function DataDisplayDemos() {
  return (
    <>
      <ComponentShowcase
        name="Badge"
        category={m.ds_category_data_display()}
        propControls={[
          {
            name: 'variant',
            type: 'select',
            options: ['default', 'secondary', 'destructive', 'outline'],
            defaultValue: 'default',
          },
          { name: 'text', type: 'text', defaultValue: 'Badge' },
        ]}
      >
        {/* TODO(#90): type preview props properly — ComponentShowcase children receive Record<string, unknown> */}
        {(props) => <Badge variant={props.variant as 'default'}>{String(props.text)}</Badge>}
      </ComponentShowcase>

      <ComponentShowcase name="Avatar" category={m.ds_category_data_display()} propControls={[]}>
        {() => (
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt={m.ds_demo_user()} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
          </div>
        )}
      </ComponentShowcase>
    </>
  )
}

function LayoutDemos() {
  return (
    <>
      <ComponentShowcase name="Card" category={m.ds_category_layout()} propControls={[]}>
        {() => (
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>{m.ds_demo_card_title()}</CardTitle>
              <CardDescription>{m.ds_demo_card_desc()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{m.ds_demo_card_content()}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">{m.ds_demo_action()}</Button>
              <Button size="sm" variant="outline">
                {m.common_cancel()}
              </Button>
            </CardFooter>
          </Card>
        )}
      </ComponentShowcase>

      <ComponentShowcase name="Separator" category={m.ds_category_layout()} propControls={[]}>
        {() => (
          <div className="max-w-sm space-y-4">
            <div>
              <h4 className="text-sm font-medium">{m.ds_demo_section_above()}</h4>
              <p className="text-sm text-muted-foreground">{m.ds_demo_content_above()}</p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium">{m.ds_demo_section_below()}</h4>
              <p className="text-sm text-muted-foreground">{m.ds_demo_content_below()}</p>
            </div>
          </div>
        )}
      </ComponentShowcase>
    </>
  )
}

function FeedbackDemos() {
  return (
    <>
      <ComponentShowcase name="Skeleton" category={m.ds_category_feedback()} propControls={[]}>
        {() => (
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        )}
      </ComponentShowcase>

      <ComponentShowcase name="Tooltip" category={m.ds_category_feedback()} propControls={[]}>
        {() => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">{m.ds_demo_hover_me()}</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{m.ds_demo_tooltip_text()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </ComponentShowcase>
    </>
  )
}

export function ComponentsSection() {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_components_title()}</h2>
      <p className="mb-8 text-muted-foreground">{m.ds_components_desc()}</p>

      <div className="space-y-10">
        <InteractiveControlDemos />
        <ToggleInputDemos />
        <DataDisplayDemos />
        <LayoutDemos />
        <FeedbackDemos />
      </div>
    </section>
  )
}
