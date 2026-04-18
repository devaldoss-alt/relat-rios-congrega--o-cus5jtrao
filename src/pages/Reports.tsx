import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle } from 'lucide-react'
import { findMonthlySummary, MonthlySummary } from '@/services/monthly_summaries'
import { getAllPublisherReportsForMonth, PublisherReport } from '@/services/publisher_reports'
import { getPublishers, Publisher } from '@/services/publishers'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function Reports() {
  const { user } = useAuth()
  const isSecretario = user?.role === 'Secretário'

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [groupReports, setGroupReports] = useState<any[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [reports, setReports] = useState<PublisherReport[]>([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const monthStr = month < 10 ? `0${month}` : `${month}`
        const mStr = `${year}-${monthStr}`

        const sum = await findMonthlySummary(year, month.toString())
        setSummary(sum)

        const greps = await pb
          .collection('group_reports')
          .getFullList({ filter: `month='${mStr}'`, expand: 'group_id' })
        setGroupReports(greps)

        const pubs = await getPublishers()
        setPublishers(pubs)

        const reps = await getAllPublisherReportsForMonth(monthStr, year)
        setReports(reps)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [month, year])

  const pendingPublishers = useMemo(() => {
    const active = publishers.filter((p) => p.active)
    let pending = active.filter(
      (pub) =>
        !reports.some((r) => r.publisher_id === pub.id || r.expand?.publisher_id?.id === pub.id),
    )

    if (!isSecretario) {
      pending = pending.filter((p) => p.expand?.group_id?.number === user?.group_number)
    }
    return pending
  }, [publishers, reports, isSecretario, user])

  const handleExport = () => {
    if (pendingPublishers.length === 0) return
    const csvContent = [
      ['Nome', 'Grupo', 'Telefone'].join(','),
      ...pendingPublishers.map(
        (p) => `"${p.name}","Grupo ${p.expand?.group_id?.number || '-'}","${p.phone || ''}"`,
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `Pendencias_${month}_${year}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios Consolidados</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhamento e fechamento mensal da congregação.
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(parseInt(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={year.toString()}
            onValueChange={(v) => setYear(parseInt(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-[110px] bg-background">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {isSecretario && (
            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-xl">Resumo do Mês</CardTitle>
                <CardDescription>
                  Dados consolidados da congregação (Extraídos do Histórico gerado em "Compilação").
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!summary ? (
                  <div className="p-8 text-center text-muted-foreground">
                    O relatório consolidado deste mês ainda não foi salvo no Histórico. <br />
                    Acesse <strong>Compilação</strong> e clique em{' '}
                    <strong>Salvar no Histórico</strong>.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Publicadores</TableHead>
                        <TableHead className="text-center">Horas Totais</TableHead>
                        <TableHead className="text-center">Estudos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Publicadores</TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.publishers.reports}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.publishers.studies}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pioneiros Auxiliares</TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.auxiliary.reports}
                        </TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.auxiliary.hours}
                        </TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.auxiliary.studies}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pioneiros Regulares</TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.regular.reports}
                        </TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.regular.hours}
                        </TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.regular.studies}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/20 font-bold">
                        <TableCell>Total Geral</TableCell>
                        <TableCell className="text-center">
                          {summary.total_active_publishers}
                        </TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.auxiliary.hours + summary.report_data.regular.hours}{' '}
                          + Pubs
                        </TableCell>
                        <TableCell className="text-center">
                          {summary.report_data.publishers.studies +
                            summary.report_data.auxiliary.studies +
                            summary.report_data.regular.studies}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-t-4 border-t-amber-500 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-500">
                    <AlertCircle className="h-5 w-5" /> Pendências de Relatório
                  </CardTitle>
                  <CardDescription>
                    Publicadores que ainda não entregaram o relatório.
                  </CardDescription>
                </div>
                {pendingPublishers.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" /> Exportar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[350px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Grupo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPublishers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                            Excelente! Nenhuma pendência para este período.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingPublishers.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                Grupo {p.expand?.group_id?.number || '-'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {isSecretario && (
              <Card className="shadow-md">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg">Desempenho dos Grupos</CardTitle>
                  <CardDescription>Horas e estudos reportados por grupo.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[350px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                        <TableRow>
                          <TableHead>Grupo</TableHead>
                          <TableHead className="text-right">Horas</TableHead>
                          <TableHead className="text-right">Estudos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupReports.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Nenhum grupo preencheu relatórios este mês.
                            </TableCell>
                          </TableRow>
                        ) : (
                          groupReports
                            .sort(
                              (a, b) =>
                                (a.expand?.group_id?.number || 0) -
                                (b.expand?.group_id?.number || 0),
                            )
                            .map((g) => {
                              const hours =
                                (g.publisher_hours || 0) +
                                (g.auxiliary_pioneer_hours || 0) +
                                (g.regular_pioneer_hours || 0)
                              const studies =
                                (g.publisher_bible_studies || 0) +
                                (g.auxiliary_pioneer_bible_studies || 0) +
                                (g.regular_pioneer_bible_studies || 0)
                              return (
                                <TableRow key={g.id}>
                                  <TableCell className="font-medium">
                                    Grupo {g.expand?.group_id?.number || '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-primary">
                                    {hours}
                                  </TableCell>
                                  <TableCell className="text-right">{studies}</TableCell>
                                </TableRow>
                              )
                            })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
