import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users } from 'lucide-react'

export function ExecutiveSummaryCard({ data }: { data: any }) {
  const stats = useMemo(() => {
    if (!data) return { rate: 0, studies: 0 }
    const { periodReports, publishers } = data
    const activePublishers = publishers.filter((p: any) => p.active)
    const uniqueReporting = new Set(periodReports.map((r: any) => r.publisher_id)).size
    const rate = activePublishers.length ? (uniqueReporting / activePublishers.length) * 100 : 0
    const studies = periodReports.reduce((acc: number, r: any) => acc + (r.bible_studies || 0), 0)
    return { rate: rate.toFixed(1), studies }
  }, [data])

  if (!data) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rate}%</div>
          <p className="text-xs text-muted-foreground">
            Publicadores ativos que relataram no período
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Estudos Bíblicos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.studies}</div>
          <p className="text-xs text-muted-foreground">Soma total no período selecionado</p>
        </CardContent>
      </Card>
    </div>
  )
}
