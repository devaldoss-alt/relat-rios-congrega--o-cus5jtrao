import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getMonthlySummaries, type MonthlySummary } from '@/services/monthly_summaries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Calendar, Loader2, Printer } from 'lucide-react'

const MONTHS: Record<string, string> = {
  '1': 'Janeiro',
  '2': 'Fevereiro',
  '3': 'Março',
  '4': 'Abril',
  '5': 'Maio',
  '6': 'Junho',
  '7': 'Julho',
  '8': 'Agosto',
  '9': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
}

export default function ReportsHistoryPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MonthlySummary | null>(null)

  useEffect(() => {
    if (user?.role === 'Secretário') {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getMonthlySummaries()
      setSummaries(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'Secretário') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Relatórios</h1>
        <p className="text-muted-foreground mt-1">Arquivo de compilações mensais</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : summaries.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-4 opacity-20" />
            <p>Nenhum relatório salvo no histórico ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <Card
              key={summary.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelected(summary)}
            >
              <CardHeader className="pb-2">
                <CardTitle>
                  {MONTHS[summary.month] || summary.month} {summary.year}
                </CardTitle>
                <CardDescription>
                  Criado em {new Date(summary.created).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publicadores:</span>
                    <span className="font-medium">{summary.total_active_publishers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Média Fim de Semana:</span>
                    <span className="font-medium">{summary.avg_attendance_weekend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl print-area print-max-w-none">
          {selected && (
            <>
              <DialogHeader className="no-print">
                <DialogTitle>
                  Relatório Mensal - {MONTHS[selected.month]} de {selected.year}
                </DialogTitle>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="hidden print:block text-center mb-8">
                  <h1 className="text-2xl font-bold">Relatório Mensal da Congregação</h1>
                  <h2 className="text-lg">
                    {MONTHS[selected.month]} de {selected.year}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Publicadores Ativos</p>
                    <p className="text-2xl font-bold">{selected.total_active_publishers}</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Média Fim de Semana</p>
                    <p className="text-2xl font-bold">{selected.avg_attendance_weekend}</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Média Meio de Semana</p>
                    <p className="text-2xl font-bold">{selected.avg_attendance_midweek}</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Relatórios</TableHead>
                        <TableHead className="text-right">Horas</TableHead>
                        <TableHead className="text-right">Estudos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Publicadores</TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.publishers?.reports || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.publishers?.hours || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.publishers?.studies || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pioneiros Auxiliares</TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.auxiliary?.reports || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.auxiliary?.hours || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.auxiliary?.studies || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pioneiros Regulares</TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.regular?.reports || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.regular?.hours || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selected.report_data.regular?.studies || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-muted/20">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {(selected.report_data.publishers?.reports || 0) +
                            (selected.report_data.auxiliary?.reports || 0) +
                            (selected.report_data.regular?.reports || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(selected.report_data.publishers?.hours || 0) +
                            (selected.report_data.auxiliary?.hours || 0) +
                            (selected.report_data.regular?.hours || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(selected.report_data.publishers?.studies || 0) +
                            (selected.report_data.auxiliary?.studies || 0) +
                            (selected.report_data.regular?.studies || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
