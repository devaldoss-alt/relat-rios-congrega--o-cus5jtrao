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
import { Clock, Users, BookOpen, Download, FileText, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getGroups, Group } from '@/services/groups'
import { getPublishers, Publisher } from '@/services/publishers'
import { calculateActivityStatus } from '@/services/publisher_reports'

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

const CustomPioneerAnnualTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const faltantes = Math.max(0, data.meta - data.horas)
    return (
      <div className="bg-background border rounded-lg shadow-sm p-3 text-sm min-w-[200px]">
        <p className="font-semibold mb-2">{data.fullName}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Acumulado:</span>
            <span className="font-medium text-foreground">{data.horas}h</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Meta Anual:</span>
            <span className="font-medium text-foreground">{data.meta}h</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t">
          {faltantes > 0 ? (
            <p className="text-amber-600 font-medium">Horas faltantes para a meta: {faltantes}</p>
          ) : (
            <p className="text-emerald-600 font-bold">Meta Atingida 🎉</p>
          )}
        </div>
      </div>
    )
  }
  return null
}

export default function Index() {
  const { user } = useAuth()
  const isSecretary = user?.role === 'Secretário'

  const [startMonth, setStartMonth] = useState(9)
  const [startYear, setStartYear] = useState(2025)
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1)
  const [endYear, setEndYear] = useState(new Date().getFullYear())

  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [groups, setGroups] = useState<Group[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])

  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const gs = await getGroups()
        setGroups(gs)
        if (!isSecretary && user?.group_number) {
          const myGroup = gs.find((g) => g.number === user.group_number)
          if (myGroup) {
            setSelectedGroupId(myGroup.id)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchGroups()
  }, [user, isSecretary])

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
        const sixMonthsAgoYear = new Date(startYear, startMonth - 1 - 5, 1).getFullYear()
        const syStartYear = endMonth >= 9 ? endYear : endYear - 1
        const minYear = Math.min(startYear, syStartYear, sixMonthsAgoYear)

        const reps = await pb.collection('publisher_reports').getFullList({
          filter: `year >= ${minYear} && year <= ${endYear}`,
          expand: 'publisher_id',
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

        const pubs = await getPublishers()
        setPublishers(pubs)
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

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const pub = r.expand?.publisher_id
      if (!pub) return false
      const isArchived = pub.status === 'Mudou-se' || pub.status === 'Removido'
      if (isArchived) return false
      if (selectedGroupId === 'all') return true
      return pub.group_id === selectedGroupId
    })
  }, [reports, selectedGroupId])

  const filteredPublishers = useMemo(() => {
    return publishers.filter((p) => {
      const isArchived = p.status === 'Mudou-se' || p.status === 'Removido'
      if (isArchived) return false
      if (selectedGroupId === 'all') return true
      return p.group_id === selectedGroupId
    })
  }, [publishers, selectedGroupId])

  const pastoralAttentionList = useMemo(() => {
    return filteredPublishers
      .map((pub) => {
        let monthsWithoutReport = 0
        for (let i = 0; i < 6; i++) {
          let m = endMonth - i
          let y = endYear
          if (m <= 0) {
            m += 12
            y -= 1
          }
          const mStr = m.toString().padStart(2, '0')
          const rep = reports.find(
            (r) => r.publisher_id === pub.id && r.month === mStr && r.year === y,
          )
          const didParticipate = rep?.participated || (rep?.hours && rep.hours > 0) || false
          if (didParticipate) {
            break
          } else {
            monthsWithoutReport++
          }
        }
        return { pub, monthsWithoutReport }
      })
      .filter((item) => item.monthsWithoutReport >= 4 && item.monthsWithoutReport <= 5)
      .sort((a, b) => b.monthsWithoutReport - a.monthsWithoutReport)
  }, [filteredPublishers, reports, endMonth, endYear])

  const exportCSV = () => {
    const mStr = endMonth.toString().padStart(2, '0')
    const currentMonthReports = filteredReports.filter(
      (r) => r.month === mStr && r.year === endYear,
    )

    const headers = ['Publicador', 'Grupo', 'Tipo', 'Participou', 'Horas', 'Estudos', 'Observacoes']
    const rows = currentMonthReports.map((r) => {
      const pub = r.expand?.publisher_id
      const groupName = groups.find((g) => g.id === pub?.group_id)?.number || '-'
      return [
        `"${pub?.name || 'Desconhecido'}"`,
        `"Grupo ${groupName}"`,
        `"${r.type || pub?.type || '-'}"`,
        r.participated || (r.hours && r.hours > 0) ? 'Sim' : 'Nao',
        r.hours || 0,
        r.bible_studies || 0,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    })

    const titleRow = `"Relatório da Congregação - Período: ${mStr}/${endYear}"\n\n`
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + titleRow + headers.join(',') + '\n' + rows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Relatorio_${mStr}_${endYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportPDF = () => {
    window.print()
  }

  const chartData = useMemo(() => {
    return monthsInRange.map((p) => {
      const mStr = p.m.toString().padStart(2, '0')
      const sum = summaries.find((s) => s.month === mStr && s.year === p.y)
      const monthReps = filteredReports.filter((r) => r.month === mStr && r.year === p.y)

      const regReps = monthReps.filter((r) => r.type === 'pioneiro_regular')
      const auxReps = monthReps.filter((r) => r.type === 'pioneiro_auxiliar')

      const regHours = regReps.reduce((s, r) => s + (r.hours || 0), 0)
      const auxHours = auxReps.reduce((s, r) => s + (r.hours || 0), 0)

      let activePubs = sum?.total_active_publishers
      if (activePubs === undefined) {
        let count = 0
        filteredPublishers.forEach((pub) => {
          const status = calculateActivityStatus(pub.id, reports, p.m, p.y)
          if (status !== 'Inativo') count++
        })
        activePubs = count
      }

      const monthAtt = attendance.filter((a) => a.meeting_date.startsWith(`${p.y}-${mStr}`))
      const avgAtt =
        monthAtt.length > 0
          ? Math.round(
              monthAtt.reduce((s, a) => s + (a.in_person || 0) + (a.zoom || 0), 0) /
                monthAtt.length,
            )
          : sum
            ? Math.round(
                ((sum.avg_attendance_midweek || 0) + (sum.avg_attendance_weekend || 0)) / 2,
              )
            : 0

      return {
        name: `${mStr}/${p.y.toString().slice(-2)}`,
        horas: monthReps.reduce((s, r) => s + (r.hours || 0), 0),
        horasPioneiroRegular: regHours,
        horasPioneiroAuxiliar: auxHours,
        horasPioneirosTotal: regHours + auxHours,
        estudos: monthReps.reduce((s, r) => s + (r.bible_studies || 0), 0),
        publicadoresAtivos: activePubs,
        assistenciaMedia: avgAtt,
      }
    })
  }, [monthsInRange, reports, filteredReports, filteredPublishers, summaries, attendance])

  const endMonthData = useMemo(() => {
    if (chartData.length === 0) return { horas: 0, estudos: 0, publicadoresAtivos: 0 }
    return chartData[chartData.length - 1]
  }, [chartData])

  const pioneerMonthlyData = useMemo(() => {
    const monthReps = filteredReports.filter(
      (r) =>
        r.month === endMonth.toString().padStart(2, '0') &&
        r.year === endYear &&
        r.type === 'pioneiro_regular',
    )
    return monthReps
      .map((r) => ({
        name: r.expand?.publisher_id?.name?.split(' ')[0] || 'Desconhecido',
        fullName: r.expand?.publisher_id?.name || 'Desconhecido',
        horas: r.hours || 0,
        meta: 50,
      }))
      .sort((a, b) => b.horas - a.horas)
  }, [reports, endMonth, endYear])

  const pioneerAnnualData = useMemo(() => {
    const syStartYear = endMonth >= 9 ? endYear : endYear - 1
    const syEndYear = syStartYear + 1

    const syReports = filteredReports.filter((r) => {
      if (r.type !== 'pioneiro_regular') return false
      const isAfterStart =
        r.year > syStartYear || (r.year === syStartYear && parseInt(r.month) >= 9)
      const isBeforeOrAtEnd =
        r.year < endYear || (r.year === endYear && parseInt(r.month) <= endMonth)
      const isWithinSYLimit = r.year < syEndYear || (r.year === syEndYear && parseInt(r.month) <= 8)
      return isAfterStart && isBeforeOrAtEnd && isWithinSYLimit
    })

    const grouped = syReports.reduce(
      (acc, r) => {
        const pubId = r.publisher_id
        if (!acc[pubId]) {
          acc[pubId] = {
            name: r.expand?.publisher_id?.name?.split(' ')[0] || 'Desconhecido',
            fullName: r.expand?.publisher_id?.name || 'Desconhecido',
            horas: 0,
            meta: 600,
          }
        }
        acc[pubId].horas += r.hours || 0
        return acc
      },
      {} as Record<string, { name: string; fullName: string; horas: number; meta: number }>,
    )

    return Object.values(grouped).sort((a, b) => b.horas - a.horas)
  }, [reports, endMonth, endYear])

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in-up print:m-0 print:p-0 print:space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
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

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden print:block mb-4 border-b pb-4">
        <h1 className="text-2xl font-bold">Relatório da Congregação</h1>
        <p className="text-muted-foreground">
          Período: {startMonth.toString().padStart(2, '0')}/{startYear} até{' '}
          {endMonth.toString().padStart(2, '0')}/{endYear}
          {selectedGroupId !== 'all' && ` - Grupo Selecionado`}
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/30 p-3 rounded-lg border shadow-sm print:hidden">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium whitespace-nowrap">Filtro de Grupo:</span>
          <Select
            value={selectedGroupId}
            onValueChange={setSelectedGroupId}
            disabled={!isSecretary}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {isSecretary && <SelectItem value="all">Todos os Grupos</SelectItem>}
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  Grupo {g.number} {g.leader ? `(Dir. por ${g.leader})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block w-px h-6 bg-border mx-2" />
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-sm font-medium whitespace-nowrap">Período:</span>
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

      {pastoralAttentionList.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm print:break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-700 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Atenção Pastoral
            </CardTitle>
            <CardDescription className="text-amber-600/80">
              Publicadores ativos que não relataram nos últimos 4 a 5 meses (Risco de inatividade).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pastoralAttentionList.map((item) => (
                <div
                  key={item.pub.id}
                  className="flex justify-between items-center bg-background/60 border border-amber-100 rounded-md p-2.5 text-sm"
                >
                  <span className="font-medium text-foreground">{item.pub.name}</span>
                  <span className="text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded text-xs">
                    {item.monthsWithoutReport} meses
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <CardTitle className="text-sm font-medium">Todos os publicadores ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endMonthData.publicadoresAtivos}</div>
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
                Comparativo: Todos os publicadores ativos vs. Assistência Média
              </CardTitle>
              <CardDescription>
                Relação entre a quantidade de publicadores ativos e a assistência média nas reuniões
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ChartContainer
                config={{
                  publicadoresAtivos: {
                    label: 'Todos os publicadores ativos',
                    color: 'hsl(var(--primary))',
                  },
                  assistenciaMedia: { label: 'Assistência Média', color: 'hsl(var(--chart-2))' },
                }}
                className="h-full w-full"
              >
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Pioneiros Regulares: Mensal
                </CardTitle>
                <CardDescription>
                  Mês atual ({endMonth.toString().padStart(2, '0')}/{endYear}) vs Meta (50h)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {pioneerMonthlyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados neste mês.
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      horas: { label: 'Horas', color: 'hsl(var(--chart-1))' },
                      meta: { label: 'Meta', color: 'hsl(var(--destructive))' },
                    }}
                    className="h-full w-full"
                  >
                    <ComposedChart
                      data={pioneerMonthlyData}
                      margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        content={<CustomPioneerAnnualTooltip />}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="horas"
                        fill="var(--color-horas)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      >
                        <LabelList
                          dataKey="horas"
                          position="top"
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Bar>
                      <Line
                        type="monotone"
                        dataKey="meta"
                        stroke="var(--color-meta)"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                    </ComposedChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Pioneiros Regulares: Anual
                </CardTitle>
                <CardDescription>
                  Ano de Serviço ({endMonth >= 9 ? endYear : endYear - 1}/
                  {endMonth >= 9 ? endYear + 1 : endYear}) vs Meta (600h)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {pioneerAnnualData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados neste ano.
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      horas: { label: 'Acumulado', color: 'hsl(var(--chart-2))' },
                      meta: { label: 'Meta Anual', color: 'hsl(var(--destructive))' },
                    }}
                    className="h-full w-full"
                  >
                    <ComposedChart
                      data={pioneerAnnualData}
                      margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="horas"
                        fill="var(--color-horas)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      >
                        <LabelList
                          dataKey="horas"
                          position="top"
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Bar>
                      <Line
                        type="monotone"
                        dataKey="meta"
                        stroke="var(--color-meta)"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                    </ComposedChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm md:col-span-3">
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
