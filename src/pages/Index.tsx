import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CartesianGrid, XAxis, YAxis, Legend, Line, LineChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Clock, Users, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
]
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function Index() {
  const { user } = useAuth()

  const [startMonth, setStartMonth] = useState(() => {
    let m = new Date().getMonth() - 4
    if (m <= 0) m += 12
    return m
  })
  const [startYear, setStartYear] = useState(() => {
    let m = new Date().getMonth() - 4
    let y = new Date().getFullYear()
    if (m <= 0) y -= 1
    return y
  })
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1)
  const [endYear, setEndYear] = useState(new Date().getFullYear())

  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<any[]>([])

  // Dashboard Comparativo State
  const [activePublishers, setActivePublishers] = useState(0)
  const [avgAttendance, setAvgAttendance] = useState(0)

  const monthsInRange = useMemo(() => {
    const res = []
    let currM = startMonth
    let currY = startYear
    while (currY < endYear || (currY === endYear && currM <= endMonth)) {
      res.push({ m: currM, y: currY })
      currM++
      if (currM > 12) {
        currM = 1
        currY++
      }
    }
    return res
  }, [startMonth, startYear, endMonth, endYear])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const pubs = await pb.collection('publishers').getFullList({ filter: 'active = true' })
        setActivePublishers(pubs.length)

        const sums = await pb
          .collection('monthly_summaries')
          .getList(1, 1, { sort: '-year,-month' })
        if (sums.items.length > 0) {
          const latest = sums.items[0]
          setAvgAttendance(
            Math.round((latest.avg_attendance_midweek + latest.avg_attendance_weekend) / 2),
          )
        } else {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          const meetings = await pb
            .collection('meeting_attendance')
            .getFullList({ filter: `meeting_date >= "${start}"` })
          if (meetings.length > 0) {
            const total = meetings.reduce((acc, m) => acc + m.in_person + m.zoom, 0)
            setAvgAttendance(Math.round(total / meetings.length))
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchDashboardData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const reps = await pb.collection('publisher_reports').getFullList({
          filter: `year >= ${startYear} && year <= ${endYear}`,
        })
        setReports(reps)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (monthsInRange.length > 0 && monthsInRange.length <= 24) {
      fetchData()
    }
  }, [startMonth, startYear, endMonth, endYear, monthsInRange])

  const isValidRange = startYear < endYear || (startYear === endYear && startMonth <= endMonth)

  const chartData = useMemo(() => {
    return monthsInRange.map((p) => {
      const mStr = p.m.toString().padStart(2, '0')
      const monthReps = reports.filter((r) => r.month === mStr && r.year === p.y)

      return {
        name: `${mStr}/${p.y.toString().slice(-2)}`,
        horas: monthReps.reduce((sum, r) => sum + (r.hours || 0), 0),
        estudos: monthReps.reduce((sum, r) => sum + (r.bible_studies || 0), 0),
        publicadores: monthReps.filter(
          (r) =>
            r.participated || (r.hours && r.hours > 0) || (r.bible_studies && r.bible_studies > 0),
        ).length,
      }
    })
  }, [monthsInRange, reports])

  const endMonthData = useMemo(() => {
    if (chartData.length === 0) return { horas: 0, estudos: 0, publicadores: 0 }
    return chartData[chartData.length - 1]
  }, [chartData])

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Bem-vindo(a), {user?.name}. Visão geral do{' '}
            {user?.role === 'Secretário'
              ? 'trabalho da congregação'
              : `seu grupo (Grupo ${user?.group_number})`}
            .
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border shadow-sm flex-wrap">
          <Select
            value={startMonth.toString()}
            onValueChange={(v) => setStartMonth(Number(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-[80px] h-8 bg-background">
              <SelectValue />
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
            value={startYear.toString()}
            onValueChange={(v) => setStartYear(Number(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-[80px] h-8 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm font-medium px-2">até</span>
          <Select
            value={endMonth.toString()}
            onValueChange={(v) => setEndMonth(Number(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-[80px] h-8 bg-background">
              <SelectValue />
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
            value={endYear.toString()}
            onValueChange={(v) => setEndYear(Number(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-[80px] h-8 bg-background">
              <SelectValue />
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

      {!isValidRange ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
          O período selecionado é inválido. Certifique-se que o mês de início é anterior ao mês de
          fim.
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Publicadores que Relataram</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endMonthData.publicadores}</div>
                <p className="text-xs text-muted-foreground">
                  No mês de {endMonth.toString().padStart(2, '0')}/{endYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endMonthData.horas}</div>
                <p className="text-xs text-muted-foreground">
                  No mês de {endMonth.toString().padStart(2, '0')}/{endYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudos Bíblicos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endMonthData.estudos}</div>
                <p className="text-xs text-muted-foreground">
                  No mês de {endMonth.toString().padStart(2, '0')}/{endYear}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm md:col-span-3 border-t-4 border-t-primary">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                Comparativo entre Publicadores Ativos e Assistência Média
              </CardTitle>
              <CardDescription>
                Visão geral da atividade vs assistência no mês mais recente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-8">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Publicadores Ativos
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-primary">{activePublishers}</span>
                    <Users className="w-8 h-8 text-primary/40" />
                  </div>
                </div>
                <div className="h-24 w-px bg-border hidden sm:block"></div>
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Assistência Média
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-emerald-600">{avgAttendance}</span>
                    <Users className="w-8 h-8 text-emerald-600/40" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Tendência de Horas no Serviço de Campo
              </CardTitle>
              <CardDescription>
                Comparativo de horas realizadas no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ChartContainer
                config={{
                  horas: { label: 'Horas Totais', color: 'hsl(var(--chart-1))' },
                }}
                className="h-full w-full"
              >
                <LineChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="horas"
                    stroke="var(--color-horas)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
