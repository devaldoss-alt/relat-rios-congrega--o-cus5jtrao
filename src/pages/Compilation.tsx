import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getCompilationData } from '@/services/compilation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, FileText, Clock, BookOpen, CalendarDays } from 'lucide-react'

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

const SummaryCard = ({ title, icon: Icon, value, subtitle, iconColor }: any) => (
  <Card className="shadow-subtle">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${iconColor}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </CardContent>
  </Card>
)

const CategoryCard = ({ title, data, color }: any) => (
  <Card className={`shadow-subtle border-t-4 ${color}`}>
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="mr-2 h-4 w-4" /> Relatórios
        </div>
        <span className="font-semibold">{data.reports}</span>
      </div>
      <div
        className={`flex justify-between items-center border-b pb-2 ${title === 'Publicadores' ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" /> Horas
        </div>
        <span className="font-semibold">{title === 'Publicadores' ? '-' : data.hours}</span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="mr-2 h-4 w-4" /> Estudos Bíblicos
        </div>
        <span className="font-semibold">{data.studies}</span>
      </div>
    </CardContent>
  </Card>
)

export default function CompilationPage() {
  const { user } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (user?.role === 'Secretário') {
      loadData()
    }
  }, [year, month, user])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getCompilationData(year, month)
      setData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'Secretário') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Apenas o Secretário tem acesso a esta página.</p>
      </div>
    )
  }

  const calculateMetrics = () => {
    if (!data) return null
    const { groupReports, meetings } = data

    const activePublishers = groupReports.reduce(
      (acc: number, curr: any) =>
        acc +
        (curr.publishers_count || 0) +
        (curr.auxiliary_pioneers_count || 0) +
        (curr.regular_pioneers_count || 0),
      0,
    )

    const getAvg = (list: any[]) => {
      if (list.length === 0) return 0
      const total = list.reduce((acc, curr) => acc + (curr.in_person || 0) + (curr.zoom || 0), 0)
      return Math.round(total / list.length)
    }

    return {
      activePublishers,
      weekendAvg: getAvg(meetings.filter((m: any) => m.meeting_type === 'domingo')),
      midweekAvg: getAvg(meetings.filter((m: any) => m.meeting_type === 'quinta')),
      publishers: {
        reports: groupReports.reduce((acc: number, c: any) => acc + (c.publishers_count || 0), 0),
        studies: groupReports.reduce(
          (acc: number, c: any) => acc + (c.publisher_bible_studies || 0),
          0,
        ),
      },
      auxiliary: {
        reports: groupReports.reduce(
          (acc: number, c: any) => acc + (c.auxiliary_pioneers_count || 0),
          0,
        ),
        hours: groupReports.reduce(
          (acc: number, c: any) => acc + (c.auxiliary_pioneer_hours || 0),
          0,
        ),
        studies: groupReports.reduce(
          (acc: number, c: any) => acc + (c.auxiliary_pioneer_bible_studies || 0),
          0,
        ),
      },
      regular: {
        reports: groupReports.reduce(
          (acc: number, c: any) => acc + (c.regular_pioneers_count || 0),
          0,
        ),
        hours: groupReports.reduce(
          (acc: number, c: any) => acc + (c.regular_pioneer_hours || 0),
          0,
        ),
        studies: groupReports.reduce(
          (acc: number, c: any) => acc + (c.regular_pioneer_bible_studies || 0),
          0,
        ),
      },
    }
  }

  const metrics = calculateMetrics()
  const isEmpty = data && data.groupReports.length === 0 && data.meetings.length === 0

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compilação de Relatório</h1>
          <p className="text-muted-foreground mt-1">Resumo mensal da congregação</p>
        </div>

        <div className="flex gap-4 items-end w-full sm:w-auto">
          <div className="space-y-2 flex-1 sm:w-40">
            <Label>Mês</Label>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-2 flex-1 sm:w-32">
            <Label>Ano</Label>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger>
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
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="shadow-subtle">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-3 w-[140px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isEmpty ? (
        <Card className="border-dashed shadow-none bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
            <p>Nenhum dado encontrado para o período selecionado</p>
          </CardContent>
        </Card>
      ) : metrics ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Publicadores Ativos"
              icon={Users}
              iconColor="text-primary"
              value={metrics.activePublishers}
              subtitle="Total de relatórios entregues"
            />
            <SummaryCard
              title="Assistência Fim de Semana"
              icon={Users}
              iconColor="text-emerald-500"
              value={metrics.weekendAvg}
              subtitle="Média do mês (Domingo)"
            />
            <SummaryCard
              title="Assistência Meio de Semana"
              icon={Users}
              iconColor="text-indigo-500"
              value={metrics.midweekAvg}
              subtitle="Média do mês (Quinta)"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CategoryCard
              title="Publicadores"
              data={metrics.publishers}
              color="border-t-slate-500"
            />
            <CategoryCard
              title="Pioneiros Auxiliares"
              data={metrics.auxiliary}
              color="border-t-sky-500"
            />
            <CategoryCard
              title="Pioneiros Regulares"
              data={metrics.regular}
              color="border-t-amber-500"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
