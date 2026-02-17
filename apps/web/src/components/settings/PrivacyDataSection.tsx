import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Download } from 'lucide-react'
import { useState } from 'react'

export function PrivacyDataSection() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/gdpr/export', {
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error('Export failed')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/)
      const filename =
        filenameMatch?.[1] ?? `roxabi-data-export-${new Date().toISOString().slice(0, 10)}.json`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Export failure — could show a toast, but keeping it simple for now
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidentialité et données</CardTitle>
        <CardDescription>Gérez vos données personnelles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          onClick={handleExport}
          loading={loading}
          loadingText="Téléchargement..."
        >
          <Download />
          Télécharger mes données
        </Button>
        <p className="text-sm text-muted-foreground">
          <a href="/settings/account" className="text-destructive hover:underline">
            Supprimer mon compte
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
