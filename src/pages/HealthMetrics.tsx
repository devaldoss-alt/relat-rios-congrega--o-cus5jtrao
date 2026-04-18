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
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { getPublishers, Publisher } from '@/services/publishers'
import { calculateActivityStatus, PublisherReport } from '@/services/publisher_reports'
import { AlertCircle, TrendingUp, Users } from 'lucide-react'
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

export default function HealthMetrics() {
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
  const [allReports, setAllReports] = useState<PublisherReport[]>([])
  const [activePublishers, setActivePublishers] = useState<Publisher[]>([])
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
        const startStr = `${startYear}-${startMonth.toString().padStart(2, '0')}`
        const endStr = `${endYear}-${endMonth.toString().padStart(2, '0')}`

        const [reps, pubs, atts] = await Promise.all([
          pb.collection('publisher_reports').getFullList<PublisherReport>({
            filter: `year >= ${startYear} && year <= ${endYear}`,
          }),
          getPublishers(),
          pb.collection('meeting_attendance').getFullList({
            filter: `meeting_date >= '${startStr}-01' && meeting_date <= '${endStr}-31'`,
          }),
        ])

        setAllReports(reps)
        setActivePublishers(pubs.filter((p) => p.active))
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

  const chartData = useMemo(() => {
    return monthsInRange.map((p) => {
      const mStr = p.m.toString().padStart(2, '0')
      const reps = allReports.filter((r) => r.month === mStr && r.year === p.y)

      const participations = reps.filter((r) => r.participated || (r.hours && r.hours > 0)).length
      const hours = reps.reduce((sum, r) => sum + (r.hours || 0), 0)
      const studies = reps.reduce((sum, r) => sum + (r.bible_studies || 0), 0)

      const monthAtt = attendance.filter((a) => a.meeting_date.startsWith(`${p.y}-${mStr}`))
      const avgAtt =
        monthAtt.length > 0
          ? Math.round(monthAtt.reduce((sum, a) => sum + a.in_person + a.zoom, 0) / monthAtt.length)
          : 0

      return {
        name: `${mStr}/${p.y.toString().slice(-2)}`,
        participantes: participations,
        horas: hours,
        estudos: studies,
        assistencia: avgAtt,
      }
    })
  }, [monthsInRange, allReports, attendance])

  const profileData = useMemo(() => {
    return [
      {
        name: 'Publicadores',
        key: 'pub',
        value: activePublishers.filter((p) => p.type === 'publicador').length,
      },
      {
        name: 'P. Auxiliares',
        key: 'aux',
        value: activePublishers.filter((p) => p.type === 'pioneiro_auxiliar').length,
      },
      {
        name: 'P. Regulares',
        key: 'reg',
        value: activePublishers.filter((p) => p.type === 'pioneiro_regular').length,
      },
    ].filter((d) => d.value > 0)
  }, [activePublishers])

  const reminders = useMemo(() => {
    return activePublishers
      .map((pub) => {
        const status = calculateActivityStatus(pub.id, allReports, endMonth, endYear)
        if (status !== 'Ativo') {
          return { pub, status }
        }
        return null
      })
      .filter(Boolean) as { pub: Publisher; status: string }[]
  }, [activePublishers, allReports, endMonth, endYear])

  const isValidRange = startYear < endYear || (startYear === endYear && startMonth <= endMonth)

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Métricas e Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Análise de tendências da congregação por período personalizado.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" /> Relatórios de Serviço
              </CardTitle>
              <CardDescription>Quantidade de publicadores que participaram</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ChartContainer
                config={{ p: { label: 'Participantes', color: 'hsl(var(--chart-1))' } }}
                className="h-full w-full"
              >
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="participantes" fill="var(--color-p)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Atividade & Assistência
              </CardTitle>
              <CardDescription>
                Comparativo entre horas trabalhadas e assistência (média)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ChartContainer
                config={{
                  h: { label: 'Horas', color: 'hsl(var(--chart-2))' },
                  a: { label: 'Assistência (Média)', color: 'hsl(var(--chart-3))' },
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
                    stroke="var(--color-h)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="assistencia"
                    stroke="var(--color-a)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">Estudos Bíblicos</CardTitle>
              <CardDescription>Evolução do número de estudos dirigidos</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ChartContainer
                config={{ s: { label: 'Estudos', color: 'hsl(var(--chart-4))' } }}
                className="h-full w-full"
              >
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="estudos" fill="var(--color-s)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Perfil da Congregação
              </CardTitle>
              <CardDescription>Distribuição dos publicadores ativos atuais</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ChartContainer
                config={{
                  pub: { label: 'Publicadores', color: 'hsl(var(--chart-1))' },
                  aux: { label: 'P. Auxiliares', color: 'hsl(var(--chart-2))' },
                  reg: { label: 'P. Regulares', color: 'hsl(var(--chart-3))' },
                }}
                className="h-full w-full"
              >
                <PieChart>
                  <Pie
                    data={profileData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {profileData.map((e, i) => (
                      <Cell key={i} fill={`var(--color-${e.key})`} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-t-4 border-t-amber-500 col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Lembretes de Pendências
              </CardTitle>
              <CardDescription>
                Publicadores que precisam de atenção baseado no mês selecionado (
                {endMonth.toString().padStart(2, '0')}/{endYear})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[350px]">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-center">Status de Atividade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Excelente! Nenhuma pendência grave de atividade no momento.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reminders.map((r) => (
                        <TableRow key={r.pub.id}>
                          <TableCell className="font-medium text-sm py-3">{r.pub.name}</TableCell>
                          <TableCell className="text-sm py-3">
                            Grupo {r.pub.expand?.group_id?.number || '-'}
                          </TableCell>
                          <TableCell className="text-center py-3">
                            {r.status === 'Não Participou' ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                Não Participou (1-5m)
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Inativo (+6m)</Badge>
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
      )}
    </div>
  )
}
