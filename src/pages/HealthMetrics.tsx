import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublishers, Publisher } from '@/services/publishers'
import { getAllPublisherReportsForMonth, PublisherReport } from '@/services/publisher_reports'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle, Activity, TrendingUp, Clock, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
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
import { useAuth } from '@/hooks/use-auth'

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

export default function HealthMetrics() {
  const { user } = useAuth()
  const isSecretario = user?.role === 'Secretário'

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const [loading, setLoading] = useState(true)
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [reportsByPeriod, setReportsByPeriod] = useState<PublisherReport[][]>([[], [], []])
  const [periods, setPeriods] = useState<{ m: number; y: number }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const reqPeriods = []
        for (let i = 0; i < 3; i++) {
          let currM = month - i
          let currY = year
          if (currM <= 0) {
            currM += 12
            currY -= 1
          }
          reqPeriods.unshift({ m: currM, y: currY })
        }

        const reportsPromises = reqPeriods.map((p) => {
          const mStr = p.m < 10 ? `0${p.m}` : `${p.m}`
          return getAllPublisherReportsForMonth(mStr, p.y).catch(() => [])
        })

        const pubsPromise = getPublishers().catch(() => [])

        const [pubs, ...reps] = await Promise.all([pubsPromise, ...reportsPromises])

        setPublishers(pubs)
        setReportsByPeriod(reps)
        setPeriods(reqPeriods)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [month, year])

  const activePublishers = useMemo(() => publishers.filter((p) => p.active), [publishers])

  const currentMonthReports = reportsByPeriod[2] || []
  const priorMonthReports = reportsByPeriod[1] || []

  const handleExport = () => {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    const data = activePublishers.map((pub) => {
      const rep = currentMonthReports.find(
        (r) => r.publisher_id === pub.id || r.expand?.publisher_id?.id === pub.id,
      )
      return {
        Nome: pub.name,
        Grupo: pub.expand?.group_id?.number || '?',
        Categoria:
          pub.type === 'pioneiro_regular'
            ? 'Pioneiro Regular'
            : pub.type === 'pioneiro_auxiliar'
              ? 'Pioneiro Auxiliar'
              : 'Publicador',
        Horas: rep?.hours || 0,
        Estudos: rep?.bible_studies || 0,
        Participou: rep?.participated ? 'Sim' : 'Não',
      }
    })

    const csvContent = [
      ['Nome', 'Grupo', 'Categoria', 'Horas', 'Estudos Bíblicos', 'Participou'].join(','),
      ...data.map(
        (r) =>
          `"${r.Nome}","${r.Grupo}","${r.Categoria}",${r.Horas},${r.Estudos},"${r.Participou}"`,
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Relatorio_Congregacao_${monthStr}_${year}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalActive = activePublishers.length
  const participatedCount = currentMonthReports.filter((r) => r.participated).length
  const participationPercentage =
    totalActive > 0 ? Math.round((participatedCount / totalActive) * 100) : 0

  const averages = useMemo(() => {
    let counts = { regular: 0, auxiliar: 0, publicador: 0 }
    let hours = { regular: 0, auxiliar: 0, publicador: 0 }

    activePublishers.forEach((pub) => {
      const typeMap: Record<string, 'regular' | 'auxiliar' | 'publicador'> = {
        pioneiro_regular: 'regular',
        pioneiro_auxiliar: 'auxiliar',
        publicador: 'publicador',
      }
      const t = typeMap[pub.type] || 'publicador'
      const rep = currentMonthReports.find(
        (r) => r.publisher_id === pub.id || r.expand?.publisher_id?.id === pub.id,
      )

      counts[t]++
      if (rep && rep.hours) hours[t] += rep.hours
    })

    return {
      regular: counts.regular ? (hours.regular / counts.regular).toFixed(1) : '0.0',
      auxiliar: counts.auxiliar ? (hours.auxiliar / counts.auxiliar).toFixed(1) : '0.0',
      publicador: counts.publicador ? (hours.publicador / counts.publicador).toFixed(1) : '0.0',
    }
  }, [activePublishers, currentMonthReports])

  const chartData = useMemo(() => {
    return periods.map((p, idx) => {
      const mStr = p.m < 10 ? `0${p.m}` : `${p.m}`
      const reps = reportsByPeriod[idx] || []

      const totalHours = reps.reduce((acc, r) => acc + (r.hours || 0), 0)
      const totalStudies = reps.reduce((acc, r) => acc + (r.bible_studies || 0), 0)

      return {
        name: `${mStr}/${p.y}`,
        'Horas Totais': totalHours,
        'Estudos Bíblicos': totalStudies,
      }
    })
  }, [periods, reportsByPeriod])

  const reminders = useMemo(() => {
    return activePublishers
      .map((pub) => {
        const priorRep = priorMonthReports.find(
          (r) => r.publisher_id === pub.id || r.expand?.publisher_id?.id === pub.id,
        )
        const currRep = currentMonthReports.find(
          (r) => r.publisher_id === pub.id || r.expand?.publisher_id?.id === pub.id,
        )

        const missingPrior = !priorRep || priorRep.participated === undefined
        const notParticipatedCurr = currRep ? currRep.participated === false : false

        if (missingPrior || notParticipatedCurr) {
          return { pub, missingPrior, notParticipatedCurr }
        }
        return null
      })
      .filter(Boolean) as { pub: Publisher; missingPrior: boolean; notParticipatedCurr: boolean }[]
  }, [activePublishers, priorMonthReports, currentMonthReports])

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Métricas de Saúde</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe os indicadores de saúde e crescimento{' '}
            {isSecretario ? 'da congregação' : 'do seu grupo'}.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Relatório
          </Button>
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(parseInt(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
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
            <SelectTrigger className="w-full sm:w-[110px]">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Publicadores Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActive}</div>
                <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{participationPercentage}%</div>
                <p className="text-xs text-muted-foreground mt-1">Dos ativos relataram</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média de Horas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pioneiros Regulares:</span>
                    <span className="font-bold">{averages.regular}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pioneiros Auxiliares:</span>
                    <span className="font-bold">{averages.auxiliar}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Publicadores:</span>
                    <span className="font-bold">{averages.publicador}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Comparativo Trimestral
                </CardTitle>
                <CardDescription>Evolução de Horas e Estudos nos últimos 3 meses</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ChartContainer
                  config={{
                    'Horas Totais': { label: 'Horas Totais', color: 'hsl(var(--chart-1))' },
                    'Estudos Bíblicos': { label: 'Estudos Bíblicos', color: 'hsl(var(--chart-2))' },
                  }}
                  className="h-full w-full"
                >
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Horas Totais" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="Estudos Bíblicos"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Lembretes de Lançamento
                </CardTitle>
                <CardDescription>
                  Publicadores com pendências no mês anterior ou inativos no atual
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[350px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-center">Mês Anterior</TableHead>
                        <TableHead className="text-center">Mês Atual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reminders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            Nenhuma pendência encontrada!
                          </TableCell>
                        </TableRow>
                      ) : (
                        reminders.map((r) => (
                          <TableRow key={r.pub.id}>
                            <TableCell className="font-medium text-sm py-3">{r.pub.name}</TableCell>
                            <TableCell className="text-center py-3">
                              {r.missingPrior ? (
                                <Badge variant="destructive">Pendente</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Entregue
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-3">
                              {r.notParticipatedCurr ? (
                                <Badge variant="destructive">Não Participou</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
