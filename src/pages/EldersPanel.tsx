import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  AlertTriangle,
  Clock,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  Award,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  MessageCircle,
  Shield,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getGroups, Group } from '@/services/groups'
import { getPublishers, Publisher } from '@/services/publishers'
import { calculateActivityStatus, PublisherReport } from '@/services/publisher_reports'
import { findMonthlySummary, MonthlySummary } from '@/services/monthly_summaries'
import { getAlerts, SystemAlert, buildWhatsAppLink } from '@/services/alerts'
import { getMinutesActions, MinuteAction } from '@/services/minutes_actions'
import { getPastoralVisits, PastoralVisit, getDerivedVisitStatus } from '@/services/pastoral_visits'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function EldersPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [reports, setReports] = useState<PublisherReport[]>([])
  const [groupReports, setGroupReports] = useState<any[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [actions, setActions] = useState<MinuteAction[]>([])
  const [pastoralVisits, setPastoralVisits] = useState<PastoralVisit[]>([])
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(null)
  const [usersList, setUsersList] = useState<any[]>([])

  const now = new Date()
  const currentMonthNum = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Mês de referência de análise (mês anterior ao atual para relatórios concluídos, ou atual)
  let refMonthNum = currentMonthNum - 1
  let refYear = currentYear
  if (refMonthNum === 0) {
    refMonthNum = 12
    refYear -= 1
  }
  const refMonthStr = refMonthNum.toString().padStart(2, '0')

  // Mês anterior ao de referência (para comparativo)
  let prevRefMonthNum = refMonthNum - 1
  let prevRefYear = refYear
  if (prevRefMonthNum === 0) {
    prevRefMonthNum = 12
    prevRefYear -= 1
  }
  const prevRefMonthStr = prevRefMonthNum.toString().padStart(2, '0')

  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all')

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [
        grps,
        pubs,
        allReports,
        gReps,
        allAlerts,
        allActions,
        allVisits,
        currSum,
        pSum,
        allUsers,
      ] = await Promise.all([
        getGroups(),
        getPublishers(),
        pb.collection('publisher_reports').getFullList({
          filter: `year >= ${currentYear - 1}`,
          sort: '-year,-month',
        }),
        pb.collection('group_reports').getFullList({
          sort: '-month',
        }),
        getAlerts("status = 'pendente'"),
        getMinutesActions(),
        getPastoralVisits('', 'scheduled_date'),
        findMonthlySummary(refYear, refMonthStr),
        findMonthlySummary(prevRefYear, prevRefMonthStr),
        pb.collection('users').getFullList(),
      ])

      setGroups(grps)
      setPublishers(pubs)
      setReports(allReports as unknown as PublisherReport[])
      setGroupReports(gReps)
      setAlerts(allAlerts)
      setActions(allActions)
      setPastoralVisits(allVisits)
      setSummary(currSum)
      setPrevSummary(pSum)
      setUsersList(allUsers)
    } catch (err) {
      console.error('Erro ao carregar dados do Painel dos Anciãos:', err)
      toast({
        title: 'Erro de carregamento',
        description: 'Não foi possível carregar todas as informações do painel.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Publicadores válidos (excluindo removidos/mudou-se)
  const activeCongPublishers = useMemo(() => {
    return publishers.filter((p) => p.status !== 'Mudou-se' && p.status !== 'Removido')
  }, [publishers])

  // Publicadores por status de atividade no mês de referência
  const publisherActivityMap = useMemo(() => {
    const map = new Map<string, string>()
    activeCongPublishers.forEach((pub) => {
      const status = calculateActivityStatus(pub.id, reports, refMonthNum, refYear)
      map.set(pub.id, status)
    })
    return map
  }, [activeCongPublishers, reports, refMonthNum, refYear])

  // Lista de "Ovelhas que precisam de cuidado" (2 a 5 meses sem relatar, que ainda não completaram 6 meses de inatividade total)
  const careSheepList = useMemo(() => {
    return activeCongPublishers
      .map((pub) => {
        let missedCount = 0
        for (let i = 0; i < 6; i++) {
          let m = currentMonthNum - 1 - i
          let y = currentYear
          while (m <= 0) {
            m += 12
            y -= 1
          }
          const mStr = m.toString().padStart(2, '0')
          const rep = reports.find(
            (r) => r.publisher_id === pub.id && r.month === mStr && r.year === y,
          )
          const participated = rep?.participated || (rep?.hours && rep.hours > 0)
          if (participated) {
            break
          } else {
            missedCount++
          }
        }
        const grp = groups.find((g) => g.id === pub.group_id)
        return {
          pub,
          groupNumber: grp?.number || 0,
          missedCount,
        }
      })
      .filter((item) => item.missedCount >= 2)
      .sort((a, b) => b.missedCount - a.missedCount)
  }, [activeCongPublishers, reports, groups, currentMonthNum, currentYear])

  // Ranking de grupos por pontualidade de lançamentos
  const groupRanking = useMemo(() => {
    return groups
      .map((g) => {
        const groupPubs = activeCongPublishers.filter((p) => p.group_id === g.id)
        const groupPubsCount = groupPubs.length
        const reportsRef = reports.filter(
          (r) =>
            r.month === refMonthStr &&
            r.year === refYear &&
            groupPubs.some((p) => p.id === r.publisher_id),
        )
        const reportsSubmitted = reportsRef.filter(
          (r) => r.participated || (r.hours && r.hours > 0),
        ).length
        const groupReportEntry = groupReports.find(
          (gr) => gr.group_id === g.id && gr.month === `${refYear}-${refMonthStr}`,
        )
        const isClosed = Boolean(groupReportEntry)
        const pct = groupPubsCount > 0 ? Math.round((reportsSubmitted / groupPubsCount) * 100) : 0

        // Líder do grupo
        const leaderUser = usersList.find((u) => u.id === g.leader)

        return {
          group: g,
          groupNumber: g.number,
          leaderName: leaderUser?.name || 'Não atribuído',
          leaderPhone: leaderUser?.phone || '',
          totalPublishers: groupPubsCount,
          submittedReports: reportsSubmitted,
          percentage: pct,
          isClosed,
        }
      })
      .sort((a, b) => b.percentage - a.percentage || (b.isClosed ? 1 : -1))
  }, [groups, activeCongPublishers, reports, groupReports, usersList, refMonthStr, refYear])

  // Resumo Comparativo por Grupo (Mês de referência vs mês anterior)
  const groupMonthlyComparison = useMemo(() => {
    return groups.map((g) => {
      const gPubs = activeCongPublishers.filter((p) => p.group_id === g.id)
      const currReps = reports.filter(
        (r) =>
          r.month === refMonthStr &&
          r.year === refYear &&
          gPubs.some((p) => p.id === r.publisher_id),
      )
      const prevReps = reports.filter(
        (r) =>
          r.month === prevRefMonthStr &&
          r.year === prevRefYear &&
          gPubs.some((p) => p.id === r.publisher_id),
      )

      const currHours = currReps.reduce((s, r) => s + (r.hours || 0), 0)
      const prevHours = prevReps.reduce((s, r) => s + (r.hours || 0), 0)
      const currStudies = currReps.reduce((s, r) => s + (r.bible_studies || 0), 0)
      const prevStudies = prevReps.reduce((s, r) => s + (r.bible_studies || 0), 0)

      const diffHours = currHours - prevHours
      const diffStudies = currStudies - prevStudies

      return {
        groupNumber: g.number,
        currHours,
        prevHours,
        diffHours,
        currStudies,
        prevStudies,
        diffStudies,
      }
    })
  }, [groups, activeCongPublishers, reports, refMonthStr, refYear, prevRefMonthStr, prevRefYear])

  // Checklist semanal de acompanhamento do Ancião ("O que falta eu fazer esta semana")
  const elderWeeklyChecklist = useMemo(() => {
    const list: Array<{
      id: string
      title: string
      category: 'relatorio' | 'pastoreio' | 'ata' | 's1'
      completed: boolean
      link?: string
      detail: string
    }> = []

    // 1. Relatório mensal pendente
    const pendingGroupAlerts = alerts.filter((a) => a.type === 'relatorio_pendente')
    if (pendingGroupAlerts.length > 0) {
      list.push({
        id: 'chk-rep',
        title: `Verificar pendências de lançamento (${pendingGroupAlerts.length} grupo(s) em aberto)`,
        category: 'relatorio',
        completed: false,
        link: '/group-data',
        detail: `Grupos: ${pendingGroupAlerts.map((a) => a.group_number).join(', ')}`,
      })
    } else {
      list.push({
        id: 'chk-rep-done',
        title: 'Todos os grupos fecharam os relatórios do mês anterior',
        category: 'relatorio',
        completed: true,
        detail: 'Nenhum lançamento pendente dos dirigentes.',
      })
    }

    // 2. Visitas de pastoreio prioritárias
    const urgentSheep = careSheepList.filter((s) => s.missedCount >= 4)
    if (urgentSheep.length > 0) {
      list.push({
        id: 'chk-shepherd',
        title: `Coordenar pastoreio de ${urgentSheep.length} publicador(es) em risco de inatividade`,
        category: 'pastoreio',
        completed: false,
        detail: `${urgentSheep
          .slice(0, 3)
          .map((s) => s.pub.name.split(' ')[0])
          .join(', ')}...`,
      })
    } else {
      list.push({
        id: 'chk-shepherd-ok',
        title: 'Sem publicadores em iminência crítica de 5 ou 6 meses sem relatar',
        category: 'pastoreio',
        completed: true,
        detail: 'A congregação mantém acompanhamento regular.',
      })
    }

    // 3. Minhas ações de atas / decisões do corpo
    const myPendingActions = actions.filter(
      (act) =>
        (act.assigned_to === user?.id || !act.assigned_to) &&
        (act.status === 'pendente' || act.status === 'em_andamento'),
    )
    if (myPendingActions.length > 0) {
      list.push({
        id: 'chk-act',
        title: `Revisar minhas ${myPendingActions.length} designação(ões) de atas de anciãos`,
        category: 'ata',
        completed: false,
        link: '/minutes',
        detail: myPendingActions.map((a) => a.title).join('; '),
      })
    } else {
      list.push({
        id: 'chk-act-ok',
        title: 'Nenhuma designação pendente nas atas para você no momento',
        category: 'ata',
        completed: true,
        detail: 'Tudo em dia com as decisões registradas.',
      })
    }

    // 4. Transmissão do S-1
    if (now.getDate() <= 15) {
      list.push({
        id: 'chk-s1',
        title: `Acompanhar fechamento e envio do relatório S-1 a Betel (prazo dia 15/${currentMonthNum})`,
        category: 's1',
        completed: Boolean(summary),
        link: '/reports',
        detail: summary ? 'Ficha S-1 consolidada no sistema.' : 'Aguardando consolidação final.',
      })
    }

    return list
  }, [alerts, careSheepList, actions, user?.id, now, currentMonthNum, summary])

  // Filtragem por Grupo selecionado na aba "Visão por Grupo"
  const selectedGroupData = useMemo(() => {
    if (selectedGroupFilter === 'all') return null
    const g = groups.find((item) => item.number.toString() === selectedGroupFilter)
    if (!g) return null

    const leader = usersList.find((u) => u.id === g.leader)
    const pubsInGroup = activeCongPublishers.filter((p) => p.group_id === g.id)
    const pendingInGroup = pubsInGroup.filter((p) => {
      const rep = reports.find(
        (r) => r.publisher_id === p.id && r.month === refMonthStr && r.year === refYear,
      )
      return !rep || (!rep.participated && !rep.hours)
    })
    const groupReport = groupReports.find(
      (gr) => gr.group_id === g.id && gr.month === `${refYear}-${refMonthStr}`,
    )

    return {
      group: g,
      leader,
      publishers: pubsInGroup,
      pendingCount: pendingInGroup.length,
      pendingList: pendingInGroup,
      groupReport,
    }
  }, [
    selectedGroupFilter,
    groups,
    usersList,
    activeCongPublishers,
    reports,
    groupReports,
    refMonthStr,
    refYear,
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Painel dos Anciãos</h1>
              <p className="text-muted-foreground text-sm">
                Acompanhamento pastoral e administrativo da congregação
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link to="/visits" className="flex items-center gap-1.5">
              <HeartHandshake className="h-4 w-4 text-rose-500" /> Visitas de Pastoreio
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" /> Relatório S-1
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/minutes" className="flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4" /> Atas & Decisões
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="coletiva" className="space-y-6">
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="coletiva">Visão Coletiva</TabsTrigger>
            <TabsTrigger value="por-grupo">Visão por Grupo</TabsTrigger>
          </TabsList>

          {/* ABA 1: VISÃO COLETIVA */}
          <TabsContent value="coletiva" className="space-y-6">
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-600 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between">
                    <span>Publicadores Ativos</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {summary?.total_active_publishers || activeCongPublishers.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Base regular da congregação no período
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between">
                    <span>Atenção Pastoral</span>
                    <HeartHandshake className="h-4 w-4 text-amber-500" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-amber-600">
                    {careSheepList.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground flex justify-between items-center">
                  <span>Sem relatar há 2+ meses</span>
                  <Link to="/visits" className="text-amber-700 font-medium hover:underline">
                    Ver visitas &rarr;
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-600 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between">
                    <span>Grupos Fechados</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {groupRanking.filter((g) => g.isClosed).length} / {groups.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Relatórios do mês de referência ({refMonthStr}/{refYear})
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between">
                    <span>Alertas do Sistema</span>
                    <AlertTriangle className="h-4 w-4 text-purple-600" />
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-purple-700">
                    {alerts.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Pendências ativas aguardando ação
                </CardContent>
              </Card>
            </div>

            {/* Seção Integrada: Visitas de Pastoreio */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-rose-500" />
                    <div>
                      <CardTitle className="text-lg">Visitas de Pastoreio</CardTitle>
                      <CardDescription>
                        Acompanhamento de visitas agendadas, atrasadas e irmãos que precisam de
                        cuidado
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1">
                      <Link to="/visits">
                        Abrir Módulo Completo <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="h-8 text-xs gap-1">
                      <Link to="/visits">
                        <Calendar className="h-3.5 w-3.5" /> Agendar Nova Visita
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded-lg border bg-amber-50/50 border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                        Visitas Agendadas
                      </span>
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-900 mt-1">
                      {pastoralVisits.filter((v) => getDerivedVisitStatus(v) === 'agendada').length}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Programadas no calendário</p>
                  </div>

                  <div className="p-3 rounded-lg border bg-rose-50/50 border-rose-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-800 uppercase tracking-wide">
                        Visitas Atrasadas
                      </span>
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <p className="text-2xl font-bold text-rose-900 mt-1">
                      {pastoralVisits.filter((v) => getDerivedVisitStatus(v) === 'atrasada').length}
                    </p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Prazo expirado sem realização
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border bg-emerald-50/50 border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                        Realizadas Recentemente
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                      {pastoralVisits.filter((v) => v.status === 'realizada').length}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Com observações registradas
                    </p>
                  </div>
                </div>

                {/* Lista de Visitas Próximas ou Atrasadas */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Próximas Visitas e Pendências de Pastoreio
                  </h4>
                  {pastoralVisits.filter((v) => v.status !== 'cancelada').length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
                      Nenhuma visita agendada no momento.{' '}
                      <Link to="/visits" className="text-primary underline">
                        Clique aqui para agendar uma visita.
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y rounded-lg border bg-card">
                      {pastoralVisits
                        .filter((v) => v.status !== 'cancelada')
                        .slice(0, 5)
                        .map((v) => {
                          const st = getDerivedVisitStatus(v)
                          const pubName =
                            v.target_family_name ||
                            v.expand?.target_publisher?.name ||
                            'Família/Irmão'
                          const elderName = v.expand?.primary_elder?.name || 'Corpo de Anciãos'
                          const dateStr = v.scheduled_date
                            ? new Date(v.scheduled_date).toLocaleDateString('pt-BR')
                            : '—'

                          return (
                            <div
                              key={v.id}
                              className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-foreground">
                                    {pubName}
                                  </span>
                                  {st === 'atrasada' && (
                                    <Badge variant="destructive" className="text-[10px]">
                                      Atrasada
                                    </Badge>
                                  )}
                                  {st === 'agendada' && (
                                    <Badge
                                      variant="outline"
                                      className="text-amber-600 border-amber-300 text-[10px]"
                                    >
                                      Agendada
                                    </Badge>
                                  )}
                                  {st === 'realizada' && (
                                    <Badge variant="default" className="bg-emerald-600 text-[10px]">
                                      Realizada
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground">
                                  <strong>Data:</strong> {dateStr} • <strong>Responsável:</strong>{' '}
                                  {elderName} • <strong>Pauta:</strong> {v.topic}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                                  <Link to="/visits">Ver detalhes</Link>
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Checklist Semanal do Ancião */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Checklist Semanal do Ancião</CardTitle>
                      <CardDescription>
                        Prioridades e pendências para a congregação esta semana
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {elderWeeklyChecklist.filter((c) => c.completed).length} /{' '}
                    {elderWeeklyChecklist.length} concluídos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {elderWeeklyChecklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between p-3 rounded-lg border text-sm transition-colors ${
                      item.completed
                        ? 'bg-muted/30 border-muted text-muted-foreground'
                        : 'bg-background border-border shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                    {item.link && (
                      <Button variant="ghost" size="sm" asChild className="shrink-0 h-8 gap-1">
                        <Link to={item.link}>
                          Ver <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Ranking de Grupos e Comparativo Mensal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ranking por Pontualidade */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Ranking de Grupos por Pontualidade ({refMonthStr}/{refYear})
                      </CardTitle>
                      <CardDescription>
                        Desempenho no envio e fechamento dos relatórios
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupRanking.map((gr, idx) => (
                    <div key={gr.group.id} className="space-y-1.5 p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded-full">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold">Grupo {gr.groupNumber}</span>
                          <span className="text-xs text-muted-foreground">({gr.leaderName})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {gr.isClosed ? (
                            <Badge variant="default" className="bg-emerald-600 text-xs">
                              Fechado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300 text-xs"
                            >
                              Pendente
                            </Badge>
                          )}
                          <span className="font-mono text-xs font-semibold">{gr.percentage}%</span>
                        </div>
                      </div>
                      <Progress value={gr.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>
                          {gr.submittedReports} de {gr.totalPublishers} relataram
                        </span>
                        {gr.leaderPhone && (
                          <a
                            href={buildWhatsAppLink(
                              gr.leaderPhone,
                              `Olá, irmão ${gr.leaderName}! Acompanhando os relatórios do Grupo ${gr.groupNumber}: temos ${gr.submittedReports}/${gr.totalPublishers} entregues. Como podemos ajudar?`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <MessageCircle className="h-3 w-3" /> Contatar dirigente
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Resumo Mensal Comparativo por Grupo */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Comparativo Mensal por Grupo
                      </CardTitle>
                      <CardDescription>
                        Mês {refMonthStr}/{refYear} vs {prevRefMonthStr}/{prevRefYear}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupMonthlyComparison.map((comp) => (
                    <div
                      key={comp.groupNumber}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
                    >
                      <div>
                        <p className="font-semibold">Grupo {comp.groupNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {comp.currHours}h atuais vs {comp.prevHours}h anteriores
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1">
                          <span>Horas:</span>
                          {comp.diffHours >= 0 ? (
                            <span className="text-emerald-600 font-semibold flex items-center">
                              <ArrowUpRight className="h-3.5 w-3.5" /> +{comp.diffHours}h
                            </span>
                          ) : (
                            <span className="text-destructive font-semibold flex items-center">
                              <ArrowDownRight className="h-3.5 w-3.5" /> {comp.diffHours}h
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span>Estudos:</span>
                          <span className="font-semibold text-foreground">{comp.currStudies}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Seção "Ovelhas que precisam de cuidado" */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-rose-500" />
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        Ovelhas que Precisam de Cuidado
                      </CardTitle>
                      <CardDescription>
                        Irmãos e irmãs sem relatar há 2 meses ou mais — ação preventiva do corpo de
                        anciãos
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50">
                    {careSheepList.length} publicador(es)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {careSheepList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Excelente! Nenhum publicador está há mais de 2 meses sem relatar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {careSheepList.map(({ pub, groupNumber, missedCount }) => (
                      <div
                        key={pub.id}
                        className="p-3 rounded-lg border bg-card flex flex-col justify-between gap-2 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-sm line-clamp-1">{pub.name}</span>
                            <Badge
                              variant={missedCount >= 5 ? 'destructive' : 'outline'}
                              className="text-xs shrink-0"
                            >
                              {missedCount} meses
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Grupo {groupNumber || '—'} • {pub.type || 'publicador'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t mt-1 gap-1 flex-wrap">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs px-2 gap-1 text-primary hover:bg-primary/10"
                            onClick={() => {
                              const pauta = `Apoio pastoral e encorajamento espiritual (${missedCount} meses sem relatar)`
                              navigate(
                                `/visits?new_for_pub=${pub.id}&topic=${encodeURIComponent(pauta)}`,
                              )
                            }}
                          >
                            <HeartHandshake className="h-3.5 w-3.5 text-rose-500" /> Agendar visita
                          </Button>

                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2">
                              <Link to={`/publishers/${pub.id}`}>Ficha</Link>
                            </Button>
                            {pub.phone ? (
                              <a
                                href={buildWhatsAppLink(
                                  pub.phone,
                                  `Olá, irmão(ã) ${pub.name.split(' ')[0]}! Tudo bem com você? Nós do corpo de anciãos estamos com saudades e queremos saber se podemos ajudar em algo. Um grande abraço!`,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 text-xs flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded"
                              >
                                <MessageCircle className="h-3 w-3" /> WhatsApp
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: VISÃO POR GRUPO */}
          <TabsContent value="por-grupo" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
              <div>
                <h3 className="font-semibold text-base">Filtro por Grupo de Serviço</h3>
                <p className="text-xs text-muted-foreground">
                  Selecione o grupo para acompanhar dirigentes, pendências e situação dos membros
                </p>
              </div>

              <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Selecione o Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visão Geral (Todos)</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.number.toString()}>
                      Grupo {g.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroupFilter === 'all' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => {
                  const leader = usersList.find((u) => u.id === g.leader)
                  const groupPubs = activeCongPublishers.filter((p) => p.group_id === g.id)
                  const submitted = reports.filter(
                    (r) =>
                      r.month === refMonthStr &&
                      r.year === refYear &&
                      groupPubs.some((p) => p.id === r.publisher_id) &&
                      (r.participated || (r.hours && r.hours > 0)),
                  ).length

                  return (
                    <Card
                      key={g.id}
                      className="cursor-pointer hover:border-primary/50 transition-all shadow-sm"
                      onClick={() => setSelectedGroupFilter(g.number.toString())}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Grupo {g.number}</CardTitle>
                            <CardDescription>
                              Dirigente: {leader?.name || 'Não atribuído'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="font-mono">
                            {groupPubs.length} publicadores
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            Relatórios entregues ({refMonthStr}/{refYear}):
                          </span>
                          <span className="font-semibold text-foreground">
                            {submitted} de {groupPubs.length}
                          </span>
                        </div>
                        <Progress
                          value={groupPubs.length ? (submitted / groupPubs.length) * 100 : 0}
                          className="h-2"
                        />
                        <div className="pt-2 flex justify-end">
                          <span className="text-xs text-primary font-medium flex items-center gap-1">
                            Abrir detalhes do grupo <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : selectedGroupData ? (
              <div className="space-y-6">
                {/* Cabeçalho do Grupo */}
                <div className="bg-card p-5 rounded-lg border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Grupo {selectedGroupData.group.number}</h2>
                    <p className="text-sm text-muted-foreground">
                      <strong>Dirigente:</strong>{' '}
                      {selectedGroupData.leader?.name || 'Não informado'} •{' '}
                      <strong>Total de Membros:</strong> {selectedGroupData.publishers.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedGroupData.leader?.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5 text-emerald-600 border-emerald-300"
                      >
                        <a
                          href={buildWhatsAppLink(
                            selectedGroupData.leader.phone,
                            `Olá, irmão ${selectedGroupData.leader.name}! Mensagem do corpo de anciãos sobre o Grupo ${selectedGroupData.group.number}.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp Dirigente
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGroupFilter('all')}>
                      Voltar a Todos
                    </Button>
                  </div>
                </div>

                {/* Pendências de Lançamento */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Situação dos Publicadores do Grupo ({refMonthStr}/{refYear})
                        </CardTitle>
                        <CardDescription>
                          Acompanhamento de relatórios e status pastoral individual
                        </CardDescription>
                      </div>
                      <Badge
                        variant={selectedGroupData.pendingCount > 0 ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {selectedGroupData.pendingCount} pendente(s)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y text-sm">
                      {selectedGroupData.publishers.map((pub) => {
                        const rep = reports.find(
                          (r) =>
                            r.publisher_id === pub.id &&
                            r.month === refMonthStr &&
                            r.year === refYear,
                        )
                        const hasSubmitted = rep?.participated || (rep?.hours && rep.hours > 0)
                        const statusAct = publisherActivityMap.get(pub.id) || 'Pendente'

                        return (
                          <div
                            key={pub.id}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="font-medium text-foreground">{pub.name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{pub.type || 'publicador'}</span>
                                  {pub.phone && <span>• {pub.phone}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {hasSubmitted ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-300 text-emerald-700 bg-emerald-50"
                                >
                                  Entregue ({rep?.hours || 0}h)
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Pendente</Badge>
                              )}

                              <Badge
                                variant={
                                  statusAct === 'Ativo'
                                    ? 'outline'
                                    : statusAct === 'Inativo'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                                className="text-xs hidden sm:inline-flex"
                              >
                                {statusAct}
                              </Badge>

                              <Button variant="ghost" size="sm" asChild className="h-8">
                                <Link to={`/publishers/${pub.id}`}>Ficha</Link>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
