import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { getPublishers, Publisher } from '@/services/publishers'
import { getAllPublisherReportsForMonth, PublisherReport } from '@/services/publisher_reports'
import { getMonthlySummaries, MonthlySummary } from '@/services/monthly_summaries'
import { getGroups, Group } from '@/services/groups'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  YAxis,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
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
import { AlertCircle, CheckCircle2, Clock, Users, BookOpen, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']

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

export default function Dashboard() {
  const { user } = useAuth()
  const isSecretario = user?.role === 'Secretário'

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [reports, setReports] = useState<PublisherReport[]>([])
  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [groupReports, setGroupReports] = useState<any[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const monthStr = month < 10 ? `0${month}` : `${month}`

        const pubsPromise = getPublishers()
        const repsPromise = getAllPublisherReportsForMonth(monthStr, year)
        const grpsPromise = getGroups()

        const [pubs, reps, grps] = await Promise.all([pubsPromise, repsPromise, grpsPromise])
        setPublishers(pubs)
        setReports(reps)
        setGroups(grps)

        if (isSecretario) {
          const sums = await getMonthlySummaries().catch(() => [])
          setSummaries(sums)
        } else {
          const greps = await pb
            .collection('group_reports')
            .getFullList({ sort: '-month' })
            .catch(() => [])
          setGroupReports(greps)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [month, year, isSecretario])

  const activePublishers = useMemo(() => publishers.filter((p) => p.active), [publishers])
  const totalActive = activePublishers.length

  const reportsSubmitted = useMemo(() => {
    return reports.filter((r) =>
      activePublishers.some((p) => p.id === r.publisher_id || r.expand?.publisher_id?.id === p.id),
    ).length
  }, [reports, activePublishers])

  const reportProgress = totalActive > 0 ? Math.round((reportsSubmitted / totalActive) * 100) : 0

  const participatedCount = reports.filter((r) => r.participated).length
  const totalHours = reports.reduce((acc, r) => acc + (r.hours || 0), 0)
  const totalStudies = reports.reduce((acc, r) => acc + (r.bible_studies || 0), 0)

  const groupGoal = useMemo(() => {
    if (isSecretario) {
      return groups.reduce((acc, g) => acc + (g.hour_goal || 0), 0)
    } else {
      const g = groups.find((g) => g.number === user?.group_number)
      return g?.hour_goal || 0
    }
  }, [groups, isSecretario, user])

  const goalProgress = groupGoal > 0 ? Math.min(Math.round((totalHours / groupGoal) * 100), 100) : 0

  const pieData = useMemo(() => {
    const counts = { publicador: 0, pioneiro_auxiliar: 0, pioneiro_regular: 0 }
    activePublishers.forEach((p) => {
      if (counts[p.type] !== undefined) counts[p.type]++
    })
    return [
      { name: 'Publicador', value: counts.publicador, fill: pieColors[0] },
      { name: 'Pio. Auxiliar', value: counts.pioneiro_auxiliar, fill: pieColors[1] },
      { name: 'Pio. Regular', value: counts.pioneiro_regular, fill: pieColors[2] },
    ].filter((d) => d.value > 0)
  }, [activePublishers])

  const barData = useMemo(() => {
    const groups: Record<string, { totalHours: number; count: number }> = {}
    reports.forEach((r) => {
      const gNum = r.expand?.publisher_id?.expand?.group_id?.number || '?'
      const label = `Grupo ${gNum}`
      if (!groups[label]) groups[label] = { totalHours: 0, count: 0 }
      groups[label].totalHours += r.hours || 0
      groups[label].count++
    })
    return Object.keys(groups)
      .sort()
      .map((k) => ({
        group: k,
        avgHours:
          groups[k].count > 0 ? Number((groups[k].totalHours / groups[k].count).toFixed(1)) : 0,
      }))
  }, [reports])

  const last6Months = useMemo(() => {
    const arr = []
    for (let i = 5; i >= 0; i--) {
      let dMonth = month - i
      let dYear = year
      while (dMonth <= 0) {
        dMonth += 12
        dYear -= 1
      }
      arr.push({ m: dMonth, y: dYear })
    }
    return arr
  }, [month, year])

  const trendData = useMemo(() => {
    if (isSecretario) {
      return last6Months.map(({ m, y }) => {
        const s = summaries.find((sum) => sum.year === y && sum.month === m.toString())
        const data = s?.report_data || {}
        const h = data.publishers?.hours || data.publisher_hours || 0
        const a = data.auxiliary?.hours || data.auxiliary_pioneer_hours || 0
        const r = data.regular?.hours || data.regular_pioneer_hours || 0
        return {
          name: `${m < 10 ? '0' + m : m}/${y}`,
          Midweek: s?.avg_attendance_midweek || 0,
          Weekend: s?.avg_attendance_weekend || 0,
          Hours: h + a + r,
        }
      })
    } else {
      return last6Months.map(({ m, y }) => {
        const mStr = `${y}-${m.toString().padStart(2, '0')}`
        const greps = groupReports.filter((g) => g.month === mStr)
        const hours = greps.reduce(
          (acc, g) =>
            acc +
            (g.publisher_hours || 0) +
            (g.auxiliary_pioneer_hours || 0) +
            (g.regular_pioneer_hours || 0),
          0,
        )
        return {
          name: `${m < 10 ? '0' + m : m}/${y}`,
          Hours: hours,
        }
      })
    }
  }, [last6Months, summaries, groupReports, isSecretario])

  const handleExport = () => {
    const monthStr = month < 10 ? `0${month}` : `${month}`
    const data = activePublishers.map((pub) => {
      const rep = reports.find(
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

  const inactiveOrPending = useMemo(() => {
    return activePublishers
      .map((pub) => {
        const rep = reports.find(
          (r) => r.publisher_id === pub.id || r.expand?.publisher_id?.id === pub.id,
        )
        if (!rep) return { ...pub, status: 'Pendente' }
        if (!rep.participated) return { ...pub, status: 'Inativo' }
        return null
      })
      .filter(Boolean) as (Publisher & { status: 'Pendente' | 'Inativo' })[]
  }, [activePublishers, reports])

  const hasTrendData = trendData.some(
    (d) => d.Hours > 0 || (d.Midweek && d.Midweek > 0) || (d.Weekend && d.Weekend > 0),
  )

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h2>
          <p className="text-muted-foreground mt-1">
            Visão geral das atividades da congregação {isSecretario ? '' : `(Seu Grupo)`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Publicadores Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{participatedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Participaram no período</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relatórios Entregues</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportsSubmitted}{' '}
                  <span className="text-sm text-muted-foreground font-normal">/ {totalActive}</span>
                </div>
                <Progress value={reportProgress} className="h-2 mt-3" />
                <p className="text-xs text-muted-foreground mt-2">{reportProgress}% do grupo</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Totais</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours}</div>
                {groupGoal > 0 ? (
                  <>
                    <Progress value={goalProgress} className="h-2 mt-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {goalProgress}% da meta ({groupGoal}h)
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Relatadas no período</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudos Bíblicos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudies}</div>
                <p className="text-xs text-muted-foreground mt-1">Dirigidos no período</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Composição de Publicadores</CardTitle>
                <CardDescription>Tipos de privilégio de serviço ativos</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center pb-8">
                {pieData.length > 0 ? (
                  <ChartContainer config={{}} className="h-full w-full">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-muted-foreground">Nenhum dado disponível para este período</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Média de Horas por Grupo</CardTitle>
                <CardDescription>Comparativo do período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {barData.length > 0 ? (
                  <ChartContainer config={{}} className="h-full w-full">
                    <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="group" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="avgHours"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        name="Média Horas"
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Nenhum dado disponível para este período
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle>Tendência de Atividade</CardTitle>
                <CardDescription>Evolução nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {hasTrendData ? (
                  <ChartContainer config={{}} className="h-full w-full">
                    <LineChart
                      data={trendData}
                      margin={{ top: 5, right: 20, bottom: 5, left: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                      {isSecretario && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                      )}
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="top" height={36} />
                      {isSecretario && (
                        <>
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Midweek"
                            name="Meio de Semana"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Weekend"
                            name="Fim de Semana"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </>
                      )}
                      <Line
                        yAxisId={isSecretario ? 'right' : 'left'}
                        type="monotone"
                        dataKey="Hours"
                        name="Horas Totais"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Nenhum dado disponível para este período
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Inatividade / Pendências
                </CardTitle>
                <CardDescription>Publicadores sem atividade no período</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[350px]">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0">
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactiveOrPending.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                            Nenhuma pendência ou inatividade!
                          </TableCell>
                        </TableRow>
                      ) : (
                        inactiveOrPending.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium text-sm py-3">{p.name}</TableCell>
                            <TableCell className="text-right py-3">
                              <Badge variant={p.status === 'Inativo' ? 'destructive' : 'secondary'}>
                                {p.status}
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
          </div>
        </>
      )}
    </div>
  )
}
