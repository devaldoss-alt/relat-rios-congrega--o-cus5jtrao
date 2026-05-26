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
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Line,
  LineChart,
  ComposedChart,
  Bar,
  LabelList,
} from 'recharts'
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

  const [startMonth, setStartMonth] = useState(9)
  const [startYear, setStartYear] = useState(2025)
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1)
  const [endYear, setEndYear] = useState(new Date().getFullYear())

  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])

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
    const fetchData = async () => {
      setLoading(true)
      try {
        const reps = await pb.collection('publisher_reports').getFullList({
          filter: `year >= ${startYear} && year <= ${endYear}`,
        })
        setReports(reps)

        const sums = await pb.collection('monthly_summaries').getFullList({
          filter: `year >= ${startYear} && year <= ${endYear}`,
        })
        setSummaries(sums)

        const startStr = `${startYear}-${startMonth.toString().padStart(2, '0')}`
        const endStr = `${endYear}-${endMonth.toString().padStart(2, '0')}`
        const atts = await pb.collection('meeting_attendance').getFullList({
          filter: `meeting_date >= '${startStr}-01' && meeting_date <= '${endStr}-31'`,
        })
        setAttendance(atts)
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

      const regReps = monthReps.filter((r) => r.type === 'pioneiro_regular')
      const auxReps = monthReps.filter((r) => r.type === 'pioneiro_auxiliar')

      const regHours = regReps.reduce((sum, r) => sum + (r.hours || 0), 0)
      const auxHours = auxReps.reduce((sum, r) => sum + (r.hours || 0), 0)

      return {
        name: `${mStr}/${p.y.toString().slice(-2)}`,
        horas: monthReps.reduce((sum, r) => sum + (r.hours || 0), 0),
        horasPioneiroRegular: regHours,
        horasPioneiroAuxiliar: auxHours,
        horasPioneirosTotal: regHours + auxHours,
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

  const comparativeChartData = useMemo(() => {
    return monthsInRange.map((p) => {
      const mStr = p.m.toString().padStart(2, '0')
      const sum = summaries.find((s) => s.month === mStr && s.year === p.y)
      const monthReps = reports.filter((r) => r.month === mStr && r.year === p.y)

      const activePubs =
        sum?.total_active_publishers ||
        monthReps.filter(
          (r) =>
            r.participated || (r.hours && r.hours > 0) || (r.bible_studies && r.bible_studies > 0),
        ).length

      const monthAtt = attendance.filter((a) => a.meeting_date.startsWith(`${p.y}-${mStr}`))
      const avgAtt =
        monthAtt.length > 0
          ? Math.round(monthAtt.reduce((s, a) => s + a.in_person + a.zoom, 0) / monthAtt.length)
          : sum
            ? Math.round((sum.avg_attendance_midweek + sum.avg_attendance_weekend) / 2)
            : 0

      return {
        name: `${mStr}/${p.y.toString().slice(-2)}`,
        publicadoresAtivos: activePubs,
        assistenciaMedia: avgAtt,
      }
    })
  }, [monthsInRange, summaries, reports, attendance])

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
                Comparativo: Publicadores Ativos vs. Assistência Média
              </CardTitle>
              <CardDescription>
                Relação entre a quantidade de publicadores ativos e a assistência média nas reuniões
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ChartContainer
                config={{
                  publicadoresAtivos: {
                    label: 'Publicadores Ativos',
                    color: 'hsl(var(--primary))',
                  },
                  assistenciaMedia: { label: 'Assistência Média', color: 'hsl(var(--chart-2))' },
                }}
                className="h-full w-full"
              >
                <ComposedChart
                  data={comparativeChartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar
                    dataKey="publicadoresAtivos"
                    fill="var(--color-publicadoresAtivos)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  >
                    <LabelList
                      dataKey="publicadoresAtivos"
                      position="top"
                      offset={10}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="assistenciaMedia"
                    stroke="var(--color-assistenciaMedia)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Tendência de Horas no Serviço de Campo
              </CardTitle>
              <CardDescription>
                Horas dos Pioneiros Regulares e Auxiliares no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ChartContainer
                config={{
                  horasPioneiroRegular: {
                    label: 'Pioneiros Regulares',
                    color: 'hsl(var(--chart-1))',
                  },
                  horasPioneiroAuxiliar: {
                    label: 'Pioneiros Auxiliares',
                    color: 'hsl(var(--chart-2))',
                  },
                  horasPioneirosTotal: { label: 'Total Pioneiros', color: 'hsl(var(--chart-3))' },
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
                    dataKey="horasPioneiroRegular"
                    stroke="var(--color-horasPioneiroRegular)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="horasPioneiroAuxiliar"
                    stroke="var(--color-horasPioneiroAuxiliar)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="horasPioneirosTotal"
                    stroke="var(--color-horasPioneirosTotal)"
                    strokeWidth={3}
                    strokeDasharray="5 5"
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
