import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getMonthlySummaries, type MonthlySummary } from '@/services/monthly_summaries'
import { getGroups } from '@/services/groups'
import pb from '@/lib/pocketbase/client'
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
  '01': 'Janeiro',
  '1': 'Janeiro',
  '02': 'Fevereiro',
  '2': 'Fevereiro',
  '03': 'Março',
  '3': 'Março',
  '04': 'Abril',
  '4': 'Abril',
  '05': 'Maio',
  '5': 'Maio',
  '06': 'Junho',
  '6': 'Junho',
  '07': 'Julho',
  '7': 'Julho',
  '08': 'Agosto',
  '8': 'Agosto',
  '09': 'Setembro',
  '9': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
}

export default function ReportsHistoryPage() {
  const { user } = useAuth()
  const isSecretary = user?.role === 'Secretário'
  const isResponsavel = user?.role === 'Responsável'

  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [groupReports, setGroupReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedSummary, setSelectedSummary] = useState<MonthlySummary | null>(null)
  const [selectedGroupReport, setSelectedGroupReport] = useState<any | null>(null)

  useEffect(() => {
    if (isSecretary) {
      loadSecretaryData()
    } else if (isResponsavel) {
      loadOverseerData()
    } else {
      setLoading(false)
    }
  }, [user, isSecretary, isResponsavel])

  const loadSecretaryData = async () => {
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

  const loadOverseerData = async () => {
    setLoading(true)
    try {
      const gs = await getGroups()
      const myGroup = gs.find((g) => g.number === user?.group_number)
      if (myGroup) {
        const greports = await pb.collection('group_reports').getFullList({
          filter: `group_id = '${myGroup.id}'`,
          sort: '-month',
        })
        setGroupReports(greports)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isSecretary && !isResponsavel) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const parseMonthStr = (monthStr: string) => {
    // "2024-05"
    if (monthStr.includes('-')) {
      const [y, m] = monthStr.split('-')
      return { month: m, year: y }
    }
    return { month: monthStr, year: '' }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          {isSecretary
            ? 'Arquivo de compilações mensais da congregação'
            : `Arquivo de relatórios do Grupo ${user?.group_number}`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isSecretary ? (
        summaries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summaries.map((summary) => (
              <Card
                key={summary.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedSummary(summary)}
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
        )
      ) : groupReports.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupReports.map((report) => {
            const { month, year } = parseMonthStr(report.month)
            return (
              <Card
                key={report.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedGroupReport(report)}
              >
                <CardHeader className="pb-2">
                  <CardTitle>
                    {MONTHS[month] || month} {year}
                  </CardTitle>
                  <CardDescription>
                    Atualizado em {new Date(report.updated).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Publicadores (Relataram):</span>
                      <span className="font-medium">{report.publishers_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de Horas:</span>
                      <span className="font-medium">
                        {(report.publisher_hours || 0) +
                          (report.auxiliary_pioneer_hours || 0) +
                          (report.regular_pioneer_hours || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Secretary Dialog */}
      <Dialog open={!!selectedSummary} onOpenChange={(open) => !open && setSelectedSummary(null)}>
        <DialogContent className="max-w-3xl print-area print-max-w-none">
          {selectedSummary && (
            <>
              <DialogHeader className="no-print">
                <DialogTitle>
                  Relatório Mensal - {MONTHS[selectedSummary.month]} de {selectedSummary.year}
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
                    {MONTHS[selectedSummary.month]} de {selectedSummary.year}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Publicadores Ativos</p>
                    <p className="text-2xl font-bold">{selectedSummary.total_active_publishers}</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Média Fim de Semana</p>
                    <p className="text-2xl font-bold">{selectedSummary.avg_attendance_weekend}</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Média Meio de Semana</p>
                    <p className="text-2xl font-bold">{selectedSummary.avg_attendance_midweek}</p>
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
                          {selectedSummary.report_data.publishers?.reports || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.publishers?.hours || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.publishers?.studies || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pioneiros Auxiliares</TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.auxiliary?.reports || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.auxiliary?.hours || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.auxiliary?.studies || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pioneiros Regulares</TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.regular?.reports || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.regular?.hours || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedSummary.report_data.regular?.studies || 0}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold bg-muted/20">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {(selectedSummary.report_data.publishers?.reports || 0) +
                            (selectedSummary.report_data.auxiliary?.reports || 0) +
                            (selectedSummary.report_data.regular?.reports || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(selectedSummary.report_data.publishers?.hours || 0) +
                            (selectedSummary.report_data.auxiliary?.hours || 0) +
                            (selectedSummary.report_data.regular?.hours || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(selectedSummary.report_data.publishers?.studies || 0) +
                            (selectedSummary.report_data.auxiliary?.studies || 0) +
                            (selectedSummary.report_data.regular?.studies || 0)}
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

      {/* Overseer Dialog */}
      <Dialog
        open={!!selectedGroupReport}
        onOpenChange={(open) => !open && setSelectedGroupReport(null)}
      >
        <DialogContent className="max-w-2xl print-area print-max-w-none">
          {selectedGroupReport &&
            (() => {
              const { month, year } = parseMonthStr(selectedGroupReport.month)
              return (
                <>
                  <DialogHeader className="no-print">
                    <DialogTitle>
                      Relatório do Grupo {user?.group_number} - {MONTHS[month] || month} / {year}
                    </DialogTitle>
                    <div className="flex justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
                      </Button>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    <div className="hidden print:block text-center mb-8">
                      <h1 className="text-2xl font-bold">
                        Relatório do Grupo {user?.group_number}
                      </h1>
                      <h2 className="text-lg">
                        {MONTHS[month] || month} de {year}
                      </h2>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Publicadores (Relataram)</TableHead>
                            <TableHead className="text-right">Horas</TableHead>
                            <TableHead className="text-right">Estudos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Publicadores</TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.publishers_count || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.publisher_hours || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.publisher_bible_studies || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Pioneiros Auxiliares</TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.auxiliary_pioneers_count || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.auxiliary_pioneer_hours || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.auxiliary_pioneer_bible_studies || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Pioneiros Regulares</TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.regular_pioneers_count || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.regular_pioneer_hours || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedGroupReport.regular_pioneer_bible_studies || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow className="font-bold bg-muted/20">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">
                              {(selectedGroupReport.publishers_count || 0) +
                                (selectedGroupReport.auxiliary_pioneers_count || 0) +
                                (selectedGroupReport.regular_pioneers_count || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {(selectedGroupReport.publisher_hours || 0) +
                                (selectedGroupReport.auxiliary_pioneer_hours || 0) +
                                (selectedGroupReport.regular_pioneer_hours || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {(selectedGroupReport.publisher_bible_studies || 0) +
                                (selectedGroupReport.auxiliary_pioneer_bible_studies || 0) +
                                (selectedGroupReport.regular_pioneer_bible_studies || 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed shadow-none bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-4 opacity-20" />
        <p>Nenhum relatório salvo no histórico ainda.</p>
      </CardContent>
    </Card>
  )
}
