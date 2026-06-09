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
  LabelList,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { getPublishers, Publisher } from '@/services/publishers'
import { calculateActivityStatus, PublisherReport } from '@/services/publisher_reports'
import {
  AlertCircle,
  Users,
  Activity,
  BookOpen,
  Clock,
  Printer,
  Download,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

const CustomIrregularTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        className="bg-background border rounded-lg shadow-xl p-3 text-sm min-w-[160px] max-w-[280px] z-[100] flex flex-col pointer-events-auto"
        style={{ maxHeight: 'min(80vh, 400px)' }}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <p className="font-semibold mb-2 shrink-0">{label}</p>
        <p className="text-destructive font-medium mb-2 shrink-0">
          Irregulares: {data.irregularCount}
        </p>
        {data.irregularNames?.length > 0 ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1 overflow-y-auto overscroll-contain pr-2 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {data.irregularNames.map((n: string, i: number) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0">Nenhum</span>
        )}
      </div>
    )
  }
  return null
}

const CustomEstudosTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        className="bg-background border rounded-lg shadow-xl p-3 text-sm min-w-[250px] max-w-[320px] z-[100] flex flex-col pointer-events-auto"
        style={{ maxHeight: 'min(80vh, 500px)' }}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <p className="font-semibold mb-2 shrink-0">{label}</p>
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: payload[0].color }} />
          <span className="font-medium text-foreground">Estudos: {data.estudos}</span>
        </div>
        {data.instructors?.length > 0 ? (
          <div className="mt-2 border-t pt-2 flex-1 overflow-hidden flex flex-col">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 shrink-0">
              Por publicador:
            </p>
            <ul className="text-xs text-foreground list-none space-y-1.5 overflow-y-auto overscroll-contain pr-2 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {data.instructors.map((inst: any, i: number) => (
                <li key={i} className="flex justify-between gap-4 items-center">
                  <span className="truncate text-muted-foreground" title={inst.name}>
                    {inst.name}
                  </span>
                  <span className="font-medium shrink-0">{inst.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground mt-2 block shrink-0">Nenhum estudo</span>
        )}
      </div>
    )
  }
  return null
}

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
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [focusedPioneer, setFocusedPioneer] = useState<string | null>(null)

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
    if (user?.role !== 'Secretário' && user?.group_number && groups.length > 0) {
      const g = groups.find((gr) => gr.number === user.group_number)
      if (g) setSelectedGroup(g.id)
    }
  }, [user, groups])

  const filteredReports = useMemo(() => {
    if (selectedGroup === 'all') return allReports
    return allReports.filter((r) => {
      const pubGrp =
        r.expand?.publisher_id?.group_id || r.expand?.publisher_id?.expand?.group_id?.id
      return pubGrp === selectedGroup
    })
  }, [allReports, selectedGroup])

  const filteredPublishers = useMemo(() => {
    if (selectedGroup === 'all') return activePublishers
    return activePublishers.filter((p) => p.group_id === selectedGroup)
  }, [activePublishers, selectedGroup])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const startStr = `${startYear}-${startMonth.toString().padStart(2, '0')}`
        const endStr = `${endYear}-${endMonth.toString().padStart(2, '0')}`

        const [reps, pubs, atts, grps] = await Promise.all([
          pb.collection('publisher_reports').getFullList<PublisherReport>({
            filter: `year >= ${startYear - 1} && year <= ${endYear}`,
            expand: 'publisher_id,publisher_id.group_id',
          }),
          getPublishers(),
          pb.collection('meeting_attendance').getFullList({
            filter: `meeting_date >= '${startStr}-01' && meeting_date <= '${endStr}-31'`,
          }),
          pb.collection('groups').getFullList({ sort: 'number' }),
        ])

        setAllReports(reps)
        setActivePublishers(pubs.filter((p) => p.active))
        setAttendance(atts)
        setGroups(grps)
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
      const reps = filteredReports.filter((r) => r.month === mStr && r.year === p.y)

      const participations = reps.filter((r) => r.participated || (r.hours && r.hours > 0)).length
      const hours = reps.reduce((sum, r) => sum + (r.hours || 0), 0)
      const studies = reps.reduce((sum, r) => sum + (r.bible_studies || 0), 0)

      const monthAtt = attendance.filter((a) => a.meeting_date.startsWith(`${p.y}-${mStr}`))
      const avgInPerson =
        monthAtt.length > 0
          ? Math.round(monthAtt.reduce((sum, a) => sum + (a.in_person || 0), 0) / monthAtt.length)
          : 0
      const avgZoom =
        monthAtt.length > 0
          ? Math.round(monthAtt.reduce((sum, a) => sum + (a.zoom || 0), 0) / monthAtt.length)
          : 0

      const weekendAtt = monthAtt.filter((a) => a.meeting_type === 'domingo')
      const avgWeekend =
        weekendAtt.length > 0
          ? Math.round(
              weekendAtt.reduce((sum, a) => sum + (a.in_person || 0) + (a.zoom || 0), 0) /
                weekendAtt.length,
            )
          : 0

      const midweekAtt = monthAtt.filter((a) => a.meeting_type === 'quinta')
      const avgMidweek =
        midweekAtt.length > 0
          ? Math.round(
              midweekAtt.reduce((sum, a) => sum + (a.in_person || 0) + (a.zoom || 0), 0) /
                midweekAtt.length,
            )
          : 0

      const pioReps = reps.filter(
        (r) => r.type === 'pioneiro_regular' || r.type === 'pioneiro_auxiliar',
      )
      const pubReps = reps.filter((r) => r.type === 'publicador' || !r.type)

      const hoursPioneers = pioReps.reduce((sum, r) => sum + (r.hours || 0), 0)
      const hoursPublishers = pubReps.reduce((sum, r) => sum + (r.hours || 0), 0)

      let irregularCount = 0
      const irregularNames: string[] = []
      filteredPublishers.forEach((pub) => {
        const status = calculateActivityStatus(pub.id, allReports, p.m, p.y)
        if (status === 'Não Participou') {
          irregularCount++
          irregularNames.push(pub.name)
        }
      })

      const instructors = reps
        .filter((r) => (r.bible_studies || 0) > 0)
        .map((r) => ({
          name: r.expand?.publisher_id?.name || 'Desconhecido',
          count: r.bible_studies || 0,
        }))
        .sort((a, b) => b.count - a.count)

      const totalActivePubs = filteredPublishers.length
      const participationRate =
        totalActivePubs > 0 ? Math.round((participations / totalActivePubs) * 100) : 0
      const studiesPerCapita =
        totalActivePubs > 0 ? Number((studies / totalActivePubs).toFixed(2)) : 0

      return {
        name: `${mStr}/${p.y.toString().slice(-2)}`,
        participantes: participations,
        horas: hours,
        estudos: studies,
        instructors,
        avgWeekend,
        avgMidweek,
        avgInPerson,
        avgZoom,
        hoursPioneers,
        hoursPublishers,
        irregularCount,
        irregularNames,
        participationRate,
        studiesPerCapita,
      }
    })
  }, [monthsInRange, filteredReports, attendance, filteredPublishers, allReports])

  const profileData = useMemo(() => {
    return [
      {
        name: 'Publicadores',
        key: 'pub',
        value: filteredPublishers.filter((p) => p.type === 'publicador').length,
      },
      {
        name: 'P. Auxiliares',
        key: 'aux',
        value: filteredPublishers.filter((p) => p.type === 'pioneiro_auxiliar').length,
      },
      {
        name: 'P. Regulares',
        key: 'reg',
        value: filteredPublishers.filter((p) => p.type === 'pioneiro_regular').length,
      },
    ].filter((d) => d.value > 0)
  }, [filteredPublishers])

  const endMonthMetrics = useMemo(() => {
    if (chartData.length === 0) return null
    return chartData[chartData.length - 1]
  }, [chartData])

  const reminders = useMemo(() => {
    return filteredPublishers
      .map((pub) => {
        const status = calculateActivityStatus(pub.id, allReports, endMonth, endYear)
        if (status !== 'Ativo') return { pub, status }
        return null
      })
      .filter(Boolean) as { pub: Publisher; status: string }[]
  }, [filteredPublishers, allReports, endMonth, endYear])

  const [lastActiveMap, setLastActiveMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const inactivePubs = reminders.filter((r) => r.status === 'Inativo')
    inactivePubs.forEach((r) => {
      if (lastActiveMap[r.pub.id] === undefined) {
        pb.collection('publisher_reports')
          .getFirstListItem(`publisher_id = '${r.pub.id}' && (participated = true || hours > 0)`, {
            sort: '-year,-month',
          })
          .then((report) => {
            const m = MONTHS.find((mo) => mo.value === Number(report.month))?.label || report.month
            setLastActiveMap((prev) => ({
              ...prev,
              [r.pub.id]: `${m}/${report.year}`,
            }))
          })
          .catch(() => {
            setLastActiveMap((prev) => ({ ...prev, [r.pub.id]: 'Desconhecido' }))
          })
      }
    })
  }, [reminders, lastActiveMap])

  const pioneerNames = useMemo(() => {
    const names = new Set<string>()
    filteredReports.forEach((r) => {
      if (r.type === 'pioneiro_regular') {
        const pubName = r.expand?.publisher_id?.name || 'Desconhecido'
        names.add(pubName)
      }
    })
    return Array.from(names).sort()
  }, [filteredReports])

  const pioneersChartData = useMemo(() => {
    return monthsInRange.map((p) => {
      const mStr = p.m.toString().padStart(2, '0')
      const reps = filteredReports.filter(
        (r) => r.month === mStr && r.year === p.y && r.type === 'pioneiro_regular',
      )

      const dataPoint: any = { name: `${mStr}/${p.y.toString().slice(-2)}` }
      pioneerNames.forEach((name, idx) => {
        const r = reps.find((rep) => (rep.expand?.publisher_id?.name || 'Desconhecido') === name)
        dataPoint[`pioneer_${idx}`] = r?.hours || 0
      })
      return dataPoint
    })
  }, [monthsInRange, filteredReports, pioneerNames])

  const pioneerConfig = useMemo(() => {
    const CHART_COLORS = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      'hsl(var(--primary))',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
    ]
    const config: any = {}
    pioneerNames.forEach((name, idx) => {
      config[`pioneer_${idx}`] = {
        label: name,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }
    })
    return config
  }, [pioneerNames])

  const isValidRange = startYear < endYear || (startYear === endYear && startMonth <= endMonth)

  const handleExportPDF = () => {
    window.print()
  }

  const handleExportExcel = () => {
    const rows = [
      [
        'Mês/Ano',
        'Participantes',
        'Horas',
        'Estudos',
        'Pioneiros (h)',
        'Publicadores (h)',
        'Irregulares',
        'Taxa Part. (%)',
        'Estudos/Capita',
      ],
      ...chartData.map((d) =>
        [
          d.name,
          d.participantes,
          d.horas,
          d.estudos,
          d.hoursPioneers,
          d.hoursPublishers,
          d.irregularCount,
          d.participationRate,
          d.studiesPerCapita,
        ].join(','),
      ),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Metricas_Saude_${endMonth}_${endYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">Métricas de Saúde da Congregação</h1>
        <p className="text-muted-foreground">
          Período: {startMonth.toString().padStart(2, '0')}/{startYear} até{' '}
          {endMonth.toString().padStart(2, '0')}/{endYear}
        </p>
        <p className="text-muted-foreground">
          Grupo:{' '}
          {selectedGroup === 'all'
            ? 'Todos os Grupos'
            : `Grupo ${groups.find((g) => g.id === selectedGroup)?.number}`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="print:hidden">
          <h2 className="text-3xl font-bold tracking-tight">Métricas de Saúde</h2>
          <p className="text-muted-foreground mt-1">
            Análise de tendências da congregação por período personalizado.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border shadow-sm print:hidden">
            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
              disabled={loading || user?.role !== 'Secretário'}
            >
              <SelectTrigger className="w-[140px] h-8 bg-background">
                <SelectValue placeholder="Todos os Grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Grupos</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    Grupo {g.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border shadow-sm flex-wrap print:hidden">
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

          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-10">
              <Printer className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-10">
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
          </div>
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endMonthMetrics?.participationRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Publicadores ativos que relataram</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudos per Capita</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endMonthMetrics?.studiesPerCapita || 0}</div>
                <p className="text-xs text-muted-foreground">Média de estudos por ativo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Publicadores Irregulares</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endMonthMetrics?.irregularCount || 0}</div>
                <p className="text-xs text-muted-foreground">1 a 5 meses sem relatar</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas: Pioneiros vs Pub</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {endMonthMetrics?.hoursPioneers || 0}{' '}
                  <span className="text-lg font-normal text-muted-foreground mx-1">vs</span>{' '}
                  {endMonthMetrics?.hoursPublishers || 0}
                </div>
                <p className="text-xs text-muted-foreground">Concentração de horas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="participantes"
                      fill="var(--color-p)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      <LabelList
                        dataKey="participantes"
                        position="top"
                        offset={10}
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Estudos Bíblicos
                </CardTitle>
                <CardDescription>Evolução do número de estudos dirigidos</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ChartContainer
                  config={{ s: { label: 'Estudos', color: 'hsl(var(--chart-4))' } }}
                  className="h-full w-full"
                >
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={<CustomEstudosTooltip />}
                      cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ zIndex: 100, pointerEvents: 'auto' }}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="estudos"
                      fill="var(--color-s)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      <LabelList
                        dataKey="estudos"
                        position="top"
                        offset={10}
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Assistência: Reuniões
                </CardTitle>
                <CardDescription>Fim de semana vs Meio de semana</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ChartContainer
                  config={{
                    we: { label: 'Fim de Semana', color: 'hsl(var(--chart-2))' },
                    mw: { label: 'Meio de Semana', color: 'hsl(var(--chart-3))' },
                  }}
                  className="h-full w-full"
                >
                  <LineChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="avgWeekend"
                      stroke="var(--color-we)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgMidweek"
                      stroke="var(--color-mw)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Assistência: Modalidade
                </CardTitle>
                <CardDescription>Evolução Presencial vs Zoom</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ChartContainer
                  config={{
                    ip: { label: 'Presencial', color: 'hsl(var(--primary))' },
                    zm: { label: 'Zoom', color: 'hsl(var(--chart-5))' },
                  }}
                  className="h-full w-full"
                >
                  <LineChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="avgInPerson"
                      stroke="var(--color-ip)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgZoom"
                      stroke="var(--color-zm)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Tendência de Irregularidade
                </CardTitle>
                <CardDescription>Publicadores sem relatar entre 1 a 5 meses</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ChartContainer
                  config={{ irr: { label: 'Irregulares', color: 'hsl(var(--destructive))' } }}
                  className="h-full w-full"
                >
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={<CustomIrregularTooltip />}
                      cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ zIndex: 100, pointerEvents: 'auto' }}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="irregularCount"
                      fill="var(--color-irr)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      <LabelList
                        dataKey="irregularCount"
                        position="top"
                        offset={10}
                        className="fill-foreground"
                        fontSize={12}
                      />
                    </Bar>
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

            <Card className="shadow-sm col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Evolução Pioneiros Regulares
                </CardTitle>
                <CardDescription>Acompanhamento de horas mensais (Alvo: 50h)</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {pioneerNames.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum pioneiro regular no período.
                  </div>
                ) : (
                  <ChartContainer config={pioneerConfig} className="h-full w-full">
                    <LineChart
                      data={pioneersChartData}
                      margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        onClick={(e: any) => {
                          if (focusedPioneer === e.dataKey) {
                            setFocusedPioneer(null)
                          } else {
                            setFocusedPioneer(e.dataKey)
                          }
                        }}
                        wrapperStyle={{ cursor: 'pointer' }}
                      />
                      <ReferenceLine
                        y={50}
                        stroke="hsl(var(--destructive))"
                        strokeDasharray="3 3"
                        label={{
                          position: 'insideTopLeft',
                          value: 'Alvo (50h)',
                          fill: 'hsl(var(--destructive))',
                          fontSize: 12,
                        }}
                      />
                      {pioneerNames.map((name, idx) => {
                        const dataKey = `pioneer_${idx}`
                        return (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={dataKey}
                            name={name}
                            stroke={
                              focusedPioneer && focusedPioneer !== dataKey
                                ? 'hsl(var(--muted-foreground))'
                                : `var(--color-${dataKey})`
                            }
                            strokeWidth={focusedPioneer === dataKey ? 3 : 2}
                            opacity={focusedPioneer && focusedPioneer !== dataKey ? 0.3 : 1}
                            dot={{ r: 4 }}
                          />
                        )
                      })}
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-amber-500 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Atenção Pastoral
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
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-600"
                                >
                                  Não Participou (1-5m)
                                </Badge>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="destructive">Inativo (+6m)</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Último:{' '}
                                    {lastActiveMap[r.pub.id] ? (
                                      lastActiveMap[r.pub.id]
                                    ) : (
                                      <Loader2 className="w-3 h-3 animate-spin inline" />
                                    )}
                                  </span>
                                </div>
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
