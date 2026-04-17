import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { getPublishers, Publisher } from '@/services/publishers'
import { getAllPublisherReportsForMonth, PublisherReport } from '@/services/publisher_reports'
import { getMonthlySummaries, MonthlySummary } from '@/services/monthly_summaries'
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
import { AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react'

const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']

export default function Dashboard() {
  const { user } = useAuth()
  const isSecretario = user?.role === 'Secretário'

  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [reports, setReports] = useState<PublisherReport[]>([])
  const [summaries, setSummaries] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)

  const currentMonth = new Date().getMonth() + 1
  const currentMonthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pubs, reps, sums] = await Promise.all([
          getPublishers(),
          getAllPublisherReportsForMonth(currentMonthStr, currentYear),
          getMonthlySummaries(),
        ])
        setPublishers(pubs)
        setReports(reps)
        setSummaries(sums)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentMonthStr, currentYear])

  const activePublishers = useMemo(() => publishers.filter((p) => p.active), [publishers])
  const totalActive = activePublishers.length

  const reportsSubmitted = useMemo(() => {
    return reports.filter((r) =>
      activePublishers.some((p) => p.id === r.publisher_id || r.expand?.publisher_id?.id === p.id),
    ).length
  }, [reports, activePublishers])

  const reportProgress = totalActive > 0 ? Math.round((reportsSubmitted / totalActive) * 100) : 0

  const totalHours = reports.reduce((acc, r) => acc + (r.hours || 0), 0)
  const avgHours = reportsSubmitted > 0 ? (totalHours / reportsSubmitted).toFixed(1) : '0.0'

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
        avgHours: Number((groups[k].totalHours / groups[k].count).toFixed(1)),
      }))
  }, [reports])

  const trendData = useMemo(() => {
    return [...summaries].reverse().map((s) => {
      const data = s.report_data || {}
      const hours =
        (data.publisher_hours || 0) +
        (data.auxiliary_pioneer_hours || 0) +
        (data.regular_pioneer_hours || 0)
      return {
        name: `${s.month}/${s.year}`,
        Midweek: s.avg_attendance_midweek || 0,
        Weekend: s.avg_attendance_weekend || 0,
        Hours: hours,
      }
    })
  }, [summaries])

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h2>
        <p className="text-muted-foreground mt-1">
          Visão geral das atividades da congregação {isSecretario ? '' : `(Seu Grupo)`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicadores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
            <p className="text-xs text-muted-foreground mt-1">No escopo de sua visão</p>
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
            <p className="text-xs text-muted-foreground mt-2">
              {reportProgress}% concluído este mês
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHours}</div>
            <p className="text-xs text-muted-foreground mt-1">Por publicador relatado</p>
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
              <p className="text-muted-foreground">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Média de Horas por Grupo</CardTitle>
            <CardDescription>Comparativo do mês atual</CardDescription>
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
                <p className="text-muted-foreground">Nenhum relatório salvo este mês</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência de Atividade</CardTitle>
            <CardDescription>Assistência e total de horas nos últimos meses</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {trendData.length > 0 ? (
              <ChartContainer config={{}} className="h-full w-full">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="top" height={36} />
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
                  <Line
                    yAxisId="right"
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
                <p className="text-muted-foreground">Sem histórico disponível</p>
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
            <CardDescription>Publicadores sem atividade neste mês</CardDescription>
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
                        Todos os publicadores estão ativos!
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
    </div>
  )
}
