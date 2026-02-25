import {
  Alert,
  AlertDescription,
  AlertTitle,
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
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui'
import { InboxIcon } from 'lucide-react'
import { useState } from 'react'
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

      <ComponentShowcase
        name="EmptyState"
        category={m.ds_category_feedback()}
        propControls={[
          {
            name: 'variant',
            type: 'select',
            options: ['default', 'error', 'search'],
            defaultValue: 'default',
          },
        ]}
      >
        {(props) => (
          <EmptyState
            variant={props.variant as 'default'}
            icon={<InboxIcon className="size-10" />}
            title={m.ds_demo_empty_state_title()}
            description={m.ds_demo_empty_state_desc()}
            action={<Button size="sm">{m.ds_demo_empty_state_action()}</Button>}
          />
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Alert"
        category={m.ds_category_feedback()}
        propControls={[
          {
            name: 'variant',
            type: 'select',
            options: ['default', 'destructive', 'warning'],
            defaultValue: 'default',
          },
        ]}
      >
        {(props) => (
          <Alert variant={props.variant as 'default'}>
            <AlertTitle>{m.ds_demo_alert_title()}</AlertTitle>
            <AlertDescription>{m.ds_demo_alert_desc()}</AlertDescription>
          </Alert>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Spinner"
        category={m.ds_category_feedback()}
        propControls={[
          {
            name: 'size',
            type: 'select',
            options: ['sm', 'default', 'lg', 'xl'],
            defaultValue: 'default',
          },
        ]}
      >
        {(props) => <Spinner size={props.size as 'default'} />}
      </ComponentShowcase>
    </>
  )
}

function OverlayDemos() {
  return (
    <>
      <ComponentShowcase name="Dialog" category={m.ds_category_overlay()} propControls={[]}>
        {() => (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">{m.ds_demo_dialog_trigger()}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{m.ds_demo_dialog_title()}</DialogTitle>
                <DialogDescription>{m.ds_demo_dialog_desc()}</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
      </ComponentShowcase>

      <ComponentShowcase
        name="Sheet"
        category={m.ds_category_overlay()}
        propControls={[
          {
            name: 'side',
            type: 'select',
            options: ['top', 'right', 'bottom', 'left'],
            defaultValue: 'right',
          },
        ]}
      >
        {(props) => (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">{m.ds_demo_sheet_trigger()}</Button>
            </SheetTrigger>
            <SheetContent side={props.side as 'right'}>
              <SheetHeader>
                <SheetTitle>{m.ds_demo_sheet_title()}</SheetTitle>
                <SheetDescription>{m.ds_demo_sheet_desc()}</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        )}
      </ComponentShowcase>

      <ConfirmDialogShowcase />
    </>
  )
}

function ConfirmDialogShowcase() {
  const [open, setOpen] = useState(false)

  return (
    <ComponentShowcase name="ConfirmDialog" category={m.ds_category_overlay()} propControls={[]}>
      {() => (
        <>
          <Button variant="outline" onClick={() => setOpen(true)}>
            {m.ds_demo_confirm_trigger()}
          </Button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title={m.ds_demo_confirm_title()}
            description={m.ds_demo_confirm_desc()}
            onConfirm={() => setOpen(false)}
          />
        </>
      )}
    </ComponentShowcase>
  )
}

function NavigationDemos() {
  return (
    <ComponentShowcase name="Tabs" category={m.ds_category_navigation()} propControls={[]}>
      {() => (
        <Tabs defaultValue="tab1" className="w-full max-w-sm">
          <TabsList>
            <TabsTrigger value="tab1">{m.ds_demo_tab_1()}</TabsTrigger>
            <TabsTrigger value="tab2">{m.ds_demo_tab_2()}</TabsTrigger>
            <TabsTrigger value="tab3">{m.ds_demo_tab_3()}</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <p className="text-sm text-muted-foreground">{m.ds_demo_tab_content_1()}</p>
          </TabsContent>
          <TabsContent value="tab2">
            <p className="text-sm text-muted-foreground">{m.ds_demo_tab_content_2()}</p>
          </TabsContent>
          <TabsContent value="tab3">
            <p className="text-sm text-muted-foreground">{m.ds_demo_tab_content_3()}</p>
          </TabsContent>
        </Tabs>
      )}
    </ComponentShowcase>
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
        <OverlayDemos />
        <NavigationDemos />
      </div>
    </section>
  )
}
