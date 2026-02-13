import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from '@repo/ui'
import { m } from '@/paraglide/messages'

type StatCardData = {
  label: string
  value: string
  trend: string
  positive: boolean
}

function getStats(): StatCardData[] {
  return [
    { label: m.ds_data_total_revenue(), value: '$45,231', trend: '+12.5%', positive: true },
    { label: m.ds_data_active_users(), value: '2,350', trend: '+3.2%', positive: true },
    { label: m.ds_data_conversion_rate(), value: '12.8%', trend: '-0.4%', positive: false },
  ]
}

/**
 * Data display composition patterns.
 *
 * Renders two patterns:
 * 1. Stat cards -- metric value, label, trend indicator
 * 2. Profile card -- avatar, name, role, bio, action buttons
 *
 * Uses real @repo/ui components with realistic (but static) data.
 */
export function DataDisplay() {
  const stats = getStats()

  return (
    <div className="space-y-10">
      {/* Stat cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{m.ds_data_stat_cards()}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      stat.positive
                        ? 'border-green-200 bg-green-100 text-green-800'
                        : 'border-red-200 bg-red-100 text-red-800'
                    )}
                  >
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Profile card */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{m.ds_data_profile_card()}</h3>
        <Card className="mx-auto max-w-sm">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar className="size-20">
              <AvatarImage src="" alt={m.ds_data_profile_name()} />
              <AvatarFallback className="text-lg">JD</AvatarFallback>
            </Avatar>
            <h4 className="mt-4 text-lg font-semibold">{m.ds_data_profile_name()}</h4>
            <p className="text-muted-foreground text-sm">{m.ds_data_profile_role()}</p>
            <p className="text-muted-foreground mt-3 text-sm">{m.ds_data_profile_bio()}</p>
            <div className="mt-6 flex gap-3">
              <Button>{m.ds_data_message()}</Button>
              <Button variant="outline">{m.ds_data_follow()}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
