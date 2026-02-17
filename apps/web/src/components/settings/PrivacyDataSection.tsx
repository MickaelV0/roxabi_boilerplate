import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Link } from '@tanstack/react-router'

export function PrivacyDataSection() {
  // TODO: implement
  // - "Download my data" button -> calls GET /api/gdpr/export
  // - "Delete my account" link -> navigates to #201 deletion flow
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidentialité et données</CardTitle>
        <CardDescription>Gérez vos données personnelles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline">
          {/* TODO: implement download handler */}
          Télécharger mes données
        </Button>
        <p className="text-sm text-muted-foreground">
          {/* TODO: link to account deletion flow from #201 */}
          <Link to="/" className="text-destructive hover:underline">
            Supprimer mon compte
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
