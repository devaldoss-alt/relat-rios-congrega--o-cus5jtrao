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
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Activity,
  Archive,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  getPublisherReportsFor6Months,
  calculateActivityStatus,
  PublisherReport,
} from '@/services/publisher_reports'
import { getGroups, Group } from '@/services/groups'
import { getPublishers, Publisher } from '@/services/publishers'
import { useAuth } from '@/hooks/use-auth'
import {
  findMonthlySummary,
  MonthlySummary,
  updateMonthlySummary,
} from '@/services/monthly_summaries'
import { useRealtime } from '@/hooks/use-realtime'

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
  const { toast } = useToast()

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedGroup, setSelectedGroup] = useState<string>(
    isSecretario ? 'all' : user?.group_number?.toString() || 'all',
  )

  const [loading, setLoading] = useState(false)
  const [reports6m, setReports6m] = useState<PublisherReport[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [allPublishers, setAllPublishers] = useState<Publisher[]>([])
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [fetchError, setFetchError] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const [reps, grps, pubs, sum] = await Promise.all([
        getPublisherReportsFor6Months(month, year),
        getGroups(),
        getPublishers(),
        findMonthlySummary(year, month.toString().padStart(2, '0')),
      ])
      setReports6m(reps)
      setGroups(grps)
      setAllPublishers(pubs)
      setSummary(sum)
      window.dispatchEvent(new CustomEvent('reports-summary-loaded', { detail: { summary: sum } }))
    } catch (e) {
      console.error(e)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('reports-date-change', { detail: { month, year, reload: loadData } }),
    )
    loadData()
  }, [month, year])

  useRealtime('monthly_summaries', (e) => {
    const mStr = month.toString().padStart(2, '0')
    if (e.action !== 'delete' && e.record.month === mStr && e.record.year === year) {
      findMonthlySummary(year, mStr).then((sum) => {
        setSummary(sum)
        window.dispatchEvent(
          new CustomEvent('reports-summary-loaded', { detail: { summary: sum } }),
        )
      })
    }
  })

  const filteredPublishers = useMemo(() => {
    if (selectedGroup === 'all') return allPublishers
    return allPublishers.filter(
      (p) => p.group_id === groups.find((g) => g.number.toString() === selectedGroup)?.id,
    )
  }, [allPublishers, selectedGroup, groups])

  const realTimeData = useMemo(() => {
    const data = {
      publicadores: { ativos: 0, relatorios: 0, hours: 0, studies: 0 },
      auxiliares: { ativos: 0, relatorios: 0, hours: 0, studies: 0 },
      regulares: { ativos: 0, relatorios: 0, hours: 0, studies: 0 },
    }

    filteredPublishers.forEach((pub) => {
      const status = calculateActivityStatus(pub.id, reports6m, month, year)

      const currentMonthStr = month.toString().padStart(2, '0')
      const currentRep = reports6m.find(
        (r) =>
          (r.publisher_id === pub.id || r.expand?.publisher_id?.id === pub.id) &&
          r.month === currentMonthStr &&
          r.year === year,
      )

      const type = currentRep?.type || pub.type || 'publicador'

      let cat = data.publicadores
      if (type === 'pioneiro_auxiliar') cat = data.auxiliares
      else if (type === 'pioneiro_regular') cat = data.regulares

      if (status !== 'Inativo') {
        cat.ativos++
      }

      if (status === 'Ativo') {
        cat.relatorios++
        if (currentRep) {
          cat.hours += currentRep.hours || 0
          cat.studies += currentRep.bible_studies || 0
        }
      }
    })

    return data
  }, [filteredPublishers, reports6m, month, year])

  const s1Data = useMemo(() => {
    const data = JSON.parse(JSON.stringify(realTimeData))
    if (summary && selectedGroup === 'all' && summary.report_data) {
      const rd = summary.report_data
      if (rd.publishers) {
        data.publicadores.relatorios = rd.publishers.reports || 0
        data.publicadores.studies = rd.publishers.studies || 0
        data.publicadores.hours = rd.publishers.hours || 0
      }
      if (rd.auxiliary) {
        data.auxiliares.relatorios = rd.auxiliary.reports || 0
        data.auxiliares.hours = rd.auxiliary.hours || 0
        data.auxiliares.studies = rd.auxiliary.studies || 0
      }
      if (rd.regular) {
        data.regulares.relatorios = rd.regular.reports || 0
        data.regulares.hours = rd.regular.hours || 0
        data.regulares.studies = rd.regular.studies || 0
      }
    }

    return data
  }, [realTimeData, summary, selectedGroup])

  const total = useMemo(() => {
    let ativos = s1Data.publicadores.ativos + s1Data.auxiliares.ativos + s1Data.regulares.ativos
    if (summary && selectedGroup === 'all' && summary.total_active_publishers !== undefined) {
      ativos = summary.total_active_publishers
    }
    return {
      ativos,
      relatorios:
        s1Data.publicadores.relatorios + s1Data.auxiliares.relatorios + s1Data.regulares.relatorios,
      hours: s1Data.publicadores.hours + s1Data.auxiliares.hours + s1Data.regulares.hours,
      studies: s1Data.publicadores.studies + s1Data.auxiliares.studies + s1Data.regulares.studies,
    }
  }, [s1Data, summary, selectedGroup])

  const [syncing, setSyncing] = useState(false)
  const ativosTempoReal =
    realTimeData.publicadores.ativos +
    realTimeData.auxiliares.ativos +
    realTimeData.regulares.ativos
  const ativosConsolidado = summary?.total_active_publishers ?? 0
  const hasDivergence = summary && selectedGroup === 'all' && ativosTempoReal !== ativosConsolidado

  const handleSyncSummary = async () => {
    if (!summary) return
    setSyncing(true)
    try {
      const updated = await updateMonthlySummary(summary.id, {
        total_active_publishers: ativosTempoReal,
      })
      setSummary(updated)
      toast({ title: 'Sincronizado', description: 'Histórico S-1 atualizado com sucesso.' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha ao sincronizar dados.', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const totalGoal = useMemo(() => {
    if (selectedGroup === 'all') {
      return groups.reduce((acc, g) => acc + (g.hour_goal || 0), 0)
    }
    const g = groups.find((g) => g.number.toString() === selectedGroup)
    return g?.hour_goal || 0
  }, [selectedGroup, groups])

  const progress = totalGoal > 0 ? Math.min((total.hours / totalGoal) * 100, 100) : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório Consolidado</h2>
          <p className="text-muted-foreground mt-1">Visualização no formato oficial S-1.</p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {isSecretario && (
            <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={loading}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Grupos</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.number.toString()}>
                    Grupo {g.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(parseInt(v))}
            disabled={loading}
          >
            <SelectTrigger className="w-[120px] bg-background">
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
            <SelectTrigger className="w-[100px] bg-background">
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

      <div className="flex flex-col md:flex-row justify-between bg-card p-6 rounded-lg border shadow-sm mb-6">
        <div className="flex gap-4 items-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Relatório de Congregação (S-1)</h3>
            <p className="text-muted-foreground">
              {selectedGroup === 'all' ? 'Congregação Inteira' : `Grupo ${selectedGroup}`}
            </p>
          </div>
        </div>
        <div className="text-left md:text-right mt-4 md:mt-0 space-y-1">
          <p className="text-sm">
            <strong>Secretário:</strong> {user?.name || 'Não informado'}
          </p>
          <p className="text-sm">
            <strong>Período:</strong> {month.toString().padStart(2, '0')}/{year}
          </p>
          <p className="text-sm">
            <strong>Atualizado em:</strong>{' '}
            {summary
              ? new Date(summary.updated).toLocaleDateString('pt-BR')
              : new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {!loading && !fetchError && summary && selectedGroup === 'all' && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Ativos por Atividade (Tempo Real)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{ativosTempoReal}</span>
                  <span className="text-sm text-muted-foreground">publicadores</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculado a partir de relatórios recentes.
                </p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                'border-border shadow-sm',
                hasDivergence ? 'border-yellow-400 bg-yellow-50/50' : '',
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <Archive className="h-4 w-4" /> Ativos Consolidados (Histórico S-1)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{ativosConsolidado}</span>
                      <span className="text-sm text-muted-foreground">publicadores</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor salvo no histórico S-1.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {hasDivergence ? (
            <Alert variant="default" className="bg-yellow-50 text-yellow-900 border-yellow-300">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800 font-bold">Divergência Encontrada</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <span>
                  A soma atual de <strong>{ativosTempoReal}</strong> difere do consolidado no
                  Histórico S-1 que é de <strong>{ativosConsolidado}</strong>. Deseja sincronizar os
                  dados?
                </span>
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
                  onClick={handleSyncSummary}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">Dados Sincronizados</AlertTitle>
              <AlertDescription>
                Os totais em tempo real coincidem com o histórico S-1. ✓ Dados do histórico oficial
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : fetchError ||
        (!summary &&
          !reports6m.some(
            (r) => r.month === month.toString().padStart(2, '0') && r.year === year,
          )) ? (
        <Card className="border-dashed shadow-none bg-muted/30 mb-6">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-center font-medium">Nenhum dado encontrado</p>
            <p className="text-sm text-center mt-1">
              Não foi possível carregar os dados para este mês ou não existem registros.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="text-sm font-medium">Publicadores</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{s1Data.publicadores.ativos}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ativos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{s1Data.publicadores.relatorios}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Relatórios
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{s1Data.publicadores.studies}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Estudos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="text-sm font-medium">Pioneiros Auxiliares</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-4 gap-1 text-center">
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.auxiliares.ativos}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Ativos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.auxiliares.relatorios}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Relats</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.auxiliares.hours}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Horas</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.auxiliares.studies}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Estudos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="text-sm font-medium">Pioneiros Regulares</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-4 gap-1 text-center">
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.regulares.ativos}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Ativos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.regulares.relatorios}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Relats</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.regulares.hours}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Horas</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{s1Data.regulares.studies}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Estudos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="bg-primary/10 pb-2">
              <CardTitle className="text-sm font-bold text-primary">Totais</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-4 gap-1 text-center">
              <div>
                <p className="text-xl font-bold text-primary">{total.ativos}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Ativos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{total.relatorios}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Relats</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{total.hours}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Horas</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary">{total.studies}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Estudos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading &&
        totalGoal > 0 &&
        !fetchError &&
        (summary ||
          reports6m.some(
            (r) => r.month === month.toString().padStart(2, '0') && r.year === year,
          )) && (
          <Card className="border-t-4 border-t-blue-500 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle>Progresso da Meta de Horas</CardTitle>
              <CardDescription>
                Acompanhamento do objetivo de horas da congregação/grupo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-lg">{total.hours}h Realizadas</span>
                <span className="text-muted-foreground font-medium text-sm">
                  Meta: {totalGoal}h
                </span>
              </div>
              <Progress value={progress} className="h-4" />
              <p className="text-right text-xs text-muted-foreground mt-2">
                {Math.round(progress)}% Concluído
              </p>
            </CardContent>
          </Card>
        )}

      {!fetchError &&
        (summary ||
          reports6m.some(
            (r) => r.month === month.toString().padStart(2, '0') && r.year === year,
          )) && (
          <Card className="shadow-md">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Anotações relevantes sobre a atividade do mês (para envio à filial ou arquivo
                local).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                placeholder="Ex: Tivemos forte chuva no segundo final de semana..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>
        )}
    </div>
  )
}
