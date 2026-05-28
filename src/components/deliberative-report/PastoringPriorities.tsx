import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function PastoringPriorities({ data }: { data: any }) {
  const priorities = useMemo(() => {
    if (!data) return []
    const { publishers, allReports, endDate } = data
    const [eY, eM] = endDate.split('-').map(Number)
    const end = new Date(eY, eM - 1, 1)
    const threshold = new Date(eY, eM - 6, 1) // 6 months before end

    return publishers
      .map((p: any) => {
        const pubReports = allReports.filter(
          (r: any) => r.publisher_id === p.id || r.expand?.publisher_id?.id === p.id,
        )
        pubReports.sort((a: any, b: any) => {
          const da = new Date(a.year, parseInt(a.month) - 1, 1)
          const db = new Date(b.year, parseInt(b.month) - 1, 1)
          return db.getTime() - da.getTime()
        })

        const lastReport = pubReports.find((r: any) => {
          const d = new Date(r.year, parseInt(r.month) - 1, 1)
          return d <= end
        })

        const lastReportDate = lastReport
          ? new Date(lastReport.year, parseInt(lastReport.month) - 1, 1)
          : null
        const isIrregular = !lastReportDate || lastReportDate < threshold

        if (!p.active || isIrregular) {
          return {
            id: p.id,
            name: p.name,
            active: p.active,
            lastReport: lastReport
              ? `${lastReport.month.padStart(2, '0')}/${lastReport.year}`
              : 'Nunca',
          }
        }
        return null
      })
      .filter(Boolean)
  }, [data])

  if (!data) return null

  return (
    <Card className="mb-6 break-inside-avoid">
      <CardHeader>
        <CardTitle>Prioridades de Pastoreio</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Publicador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Relatório (No período)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priorities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhuma prioridade encontrada no período.
                </TableCell>
              </TableRow>
            ) : (
              priorities.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? 'secondary' : 'destructive'}>
                      {p.active ? 'Irregular (6+ meses)' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.lastReport}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
