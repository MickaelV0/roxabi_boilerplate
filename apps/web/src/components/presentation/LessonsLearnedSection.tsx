import { AnimatedSection, Card, cn } from '@repo/ui'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import { m } from '@/paraglide/messages'

type LessonColumn = {
  id: string
  icon: ComponentType<{ className?: string }>
  iconColor: string
  borderColor: string
  title: () => string
  items: ReadonlyArray<{ id: string; text: () => string }>
}

export function LessonsLearnedSection() {
  const columns: ReadonlyArray<LessonColumn> = [
    {
      id: 'works',
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/20',
      title: m.talk_lessons_works,
      items: [
        { id: 'works-1', text: m.talk_lessons_works_1 },
        { id: 'works-2', text: m.talk_lessons_works_2 },
        { id: 'works-3', text: m.talk_lessons_works_3 },
      ],
    },
    {
      id: 'doesnt',
      icon: XCircle,
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/20',
      title: m.talk_lessons_doesnt,
      items: [
        { id: 'doesnt-1', text: m.talk_lessons_doesnt_1 },
        { id: 'doesnt-2', text: m.talk_lessons_doesnt_2 },
        { id: 'doesnt-3', text: m.talk_lessons_doesnt_3 },
      ],
    },
    {
      id: 'changed',
      icon: RefreshCw,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20',
      title: m.talk_lessons_changed,
      items: [
        { id: 'changed-1', text: m.talk_lessons_changed_1 },
        { id: 'changed-2', text: m.talk_lessons_changed_2 },
        { id: 'changed-3', text: m.talk_lessons_changed_3 },
      ],
    },
  ]

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-chart-4/5 blur-[100px] dark:bg-chart-4/10" />
      </div>

      <AnimatedSection>
        <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">{m.talk_lessons_title()}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_lessons_subtitle()}</p>
      </AnimatedSection>

      <AnimatedSection className="mt-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {columns.map((column) => (
            <Card key={column.id} variant="subtle" className={cn('p-5', column.borderColor)}>
              <div className="flex items-center gap-2 mb-4">
                <column.icon className={cn('h-5 w-5', column.iconColor)} />
                <h3 className="text-base font-semibold">{column.title()}</h3>
              </div>
              <ul className="space-y-2.5">
                {column.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <column.icon className={cn('h-4 w-4 mt-0.5 shrink-0', column.iconColor)} />
                    <span className="text-sm text-muted-foreground">{item.text()}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </AnimatedSection>
    </div>
  )
}
