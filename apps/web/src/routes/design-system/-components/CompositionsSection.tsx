import { Separator } from '@repo/ui'
import { m } from '@/paraglide/messages'

import { AuthForms } from './compositions/AuthForms'
import { DataDisplay } from './compositions/DataDisplay'
import { FeedbackPatterns } from './compositions/FeedbackPatterns'

export function CompositionsSection() {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_compositions_title()}</h2>
      <p className="mb-8 text-muted-foreground">{m.ds_compositions_desc()}</p>

      <div className="space-y-12">
        <div>
          <h3 className="mb-4 text-xl font-semibold">{m.ds_compositions_auth()}</h3>
          <AuthForms />
        </div>

        <Separator />

        <div>
          <h3 className="mb-4 text-xl font-semibold">{m.ds_compositions_data()}</h3>
          <DataDisplay />
        </div>

        <Separator />

        <div>
          <h3 className="mb-4 text-xl font-semibold">{m.ds_compositions_feedback()}</h3>
          <FeedbackPatterns />
        </div>
      </div>
    </section>
  )
}
