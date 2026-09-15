import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  HeartHandshake,
  Search,
  MessageCircle,
  FileText,
  CalendarDays,
  ListFilter,
  Users,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Check,
  Send,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  PastoralVisit,
  getPastoralVisits,
  createPastoralVisit,
  updatePastoralVisit,
  deletePastoralVisit,
  getDerivedVisitStatus,
  VisitStatus,
} from '@/services/pastoral_visits'
import { buildWhatsAppLink, sendElderNotificationEmail } from '@/services/alerts'
import { getPublishers, Publisher } from '@/services/publishers'
import { getGroups, Group } from '@/services/groups'

export default function PastoralVisitsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const isSecretaryOrElder =
    user?.role === 'Secretário' || user?.role === 'Ancião' || user?.role === 'Responsável'

  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<PastoralVisit[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [eldersList, setEldersList] = useState<any[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'agendada' | 'realizada' | 'atrasada'>(
    'todos',
  )
  const [elderFilter, setElderFilter] = useState<string>('todos')
  const [groupFilter, setGroupFilter] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista')

  // Mês / Período para o calendário
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())

  // Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState<PastoralVisit | null>(null)
  const [formPublisherId, setFormPublisherId] = useState<string>('')
  const [formFamilyName, setFormFamilyName] = useState<string>('')
  const [formScheduledDate, setFormScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  )
  const [formTopic, setFormTopic] = useState<string>('')
  const [formPrimaryElder, setFormPrimaryElder] = useState<string>('')
  const [formCompanionElder, setFormCompanionElder] = useState<string>('')
  const [formStatus, setFormStatus] = useState<VisitStatus>('agendada')
  const [formCompletionDate, setFormCompletionDate] = useState<string>('')
  const [formNotes, setFormNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Modal de Concluir Visita / Observações
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [completingVisit, setCompletingVisit] = useState<PastoralVisit | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0])
  const [completing, setCompleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [vList, pubs, users, grps] = await Promise.all([
        getPastoralVisits('', 'scheduled_date'),
        getPublishers(),
        pb.collection('users').getFullList({
          filter: "role = 'Ancião' || role = 'Secretário' || role = 'Responsável'",
          sort: 'name',
        }),
        getGroups(),
      ])

      setVisits(vList)
      setPublishers(pubs)
      setEldersList(users)
      setGroups(grps)
    } catch (err) {
      console.error('Erro ao carregar dados de visitas:', err)
      toast({
        title: 'Erro ao carregar visitas',
        description: 'Não foi possível buscar as visitas de pastoreio.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Verificar se veio de uma sugestão do elders-panel com query params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const newFromPub = params.get('new_for_pub')
    const suggestedTopic = params.get('topic')

    if (newFromPub && publishers.length > 0) {
      const pub = publishers.find((p) => p.id === newFromPub)
      if (pub) {
        setEditingVisit(null)
        setFormPublisherId(pub.id)
        setFormFamilyName(pub.name)
        setFormTopic(
          suggestedTopic ||
            `Visita de pastoreio e encorajamento espiritual com ${pub.name.split(' ')[0]}`,
        )
        setFormScheduledDate(new Date().toISOString().split('T')[0])
        setFormPrimaryElder(user?.id || '')
        setFormCompanionElder('')
        setFormStatus('agendada')
        setFormCompletionDate('')
        setFormNotes('')
        setIsModalOpen(true)

        // Limpar parâmetros da URL sem recarregar a página
        navigate('/visits', { replace: true })
      }
    }
  }, [location.search, publishers, user?.id, navigate])

  const openNewVisitModal = () => {
    setEditingVisit(null)
    setFormPublisherId('')
    setFormFamilyName('')
    setFormScheduledDate(new Date().toISOString().split('T')[0])
    setFormTopic('Encorajamento espiritual e apoio à família')
    setFormPrimaryElder(user?.id || '')
    setFormCompanionElder('')
    setFormStatus('agendada')
    setFormCompletionDate('')
    setFormNotes('')
    setIsModalOpen(true)
  }

  const openEditModal = (visit: PastoralVisit) => {
    setEditingVisit(visit)
    setFormPublisherId(visit.target_publisher || '')
    setFormFamilyName(visit.target_family_name || '')
    setFormScheduledDate(
      visit.scheduled_date
        ? visit.scheduled_date.substring(0, 10)
        : new Date().toISOString().split('T')[0],
    )
    setFormTopic(visit.topic || '')
    setFormPrimaryElder(visit.primary_elder || '')

    // Companheiro (segundo ancião no array de responsibles)
    const companion = visit.responsible_elders?.find((id) => id !== visit.primary_elder) || ''
    setFormCompanionElder(companion)

    setFormStatus(visit.status || 'agendada')
    setFormCompletionDate(visit.completion_date ? visit.completion_date.substring(0, 10) : '')
    setFormNotes(visit.notes || '')
    setIsModalOpen(true)
  }

  const handleSaveVisit = async () => {
    if (!formTopic.trim()) {
      return toast({ title: 'Preencha a pauta ou motivo da visita', variant: 'destructive' })
    }
    if (!formScheduledDate) {
      return toast({ title: 'Informe a data prevista da visita', variant: 'destructive' })
    }

    setSaving(true)
    try {
      const responsibleIds: string[] = []
      if (formPrimaryElder) responsibleIds.push(formPrimaryElder)
      if (formCompanionElder && formCompanionElder !== formPrimaryElder) {
        responsibleIds.push(formCompanionElder)
      }

      let selectedPubName = formFamilyName
      if (formPublisherId) {
        const found = publishers.find((p) => p.id === formPublisherId)
        if (found) selectedPubName = found.name
      }

      const payload: Partial<PastoralVisit> = {
        target_publisher: formPublisherId || undefined,
        target_family_name: selectedPubName || 'Família da congregação',
        primary_elder: formPrimaryElder || undefined,
        responsible_elders: responsibleIds,
        scheduled_date: `${formScheduledDate} 19:30:00.000Z`,
        topic: formTopic.trim(),
        status: formStatus,
        completion_date: formCompletionDate ? `${formCompletionDate} 20:00:00.000Z` : undefined,
        notes: formNotes.trim() || undefined,
      }

      if (editingVisit) {
        await updatePastoralVisit(editingVisit.id, payload)
        toast({ title: 'Visita de pastoreio atualizada com sucesso!' })
      } else {
        await createPastoralVisit(payload)
        toast({ title: 'Visita de pastoreio agendada com sucesso!' })
      }

      setIsModalOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar visita', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVisit = async (id: string) => {
    if (!confirm('Deseja realmente excluir este agendamento de visita?')) return
    try {
      await deletePastoralVisit(id)
      toast({ title: 'Visita excluída com sucesso!' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao excluir visita', variant: 'destructive' })
    }
  }

  const openCompleteModal = (visit: PastoralVisit) => {
    setCompletingVisit(visit)
    setCompletionNotes(visit.notes || '')
    setCompletionDate(new Date().toISOString().split('T')[0])
    setIsCompleteModalOpen(true)
  }

  const handleConfirmCompletion = async () => {
    if (!completingVisit) return
    setCompleting(true)
    try {
      await updatePastoralVisit(completingVisit.id, {
        status: 'realizada',
        completion_date: `${completionDate} 20:00:00.000Z`,
        notes: completionNotes.trim() || undefined,
      })
      toast({ title: 'Visita registrada como realizada com sucesso!' })
      setIsCompleteModalOpen(false)
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao concluir visita', variant: 'destructive' })
    } finally {
      setCompleting(false)
    }
  }

  // Filtragem da lista
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const derivedStatus = getDerivedVisitStatus(visit)

      // Filtro de status
      if (statusFilter !== 'todos') {
        if (derivedStatus !== statusFilter) return false
      }

      // Filtro de ancião
      if (elderFilter !== 'todos') {
        const isAssigned =
          visit.primary_elder === elderFilter ||
          (visit.responsible_elders && visit.responsible_elders.includes(elderFilter))
        if (!isAssigned) return false
      }

      // Filtro de grupo
      if (groupFilter !== 'todos') {
        const pub = publishers.find((p) => p.id === visit.target_publisher)
        const grp = groups.find((g) => g.id === pub?.group_id)
        if (grp?.number.toString() !== groupFilter) return false
      }

      // Busca por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName =
          visit.target_family_name?.toLowerCase().includes(q) ||
          false ||
          visit.expand?.target_publisher?.name.toLowerCase().includes(q) ||
          false
        const matchTopic = visit.topic?.toLowerCase().includes(q) || false
        const matchNotes = visit.notes?.toLowerCase().includes(q) || false
        const matchElder = visit.expand?.primary_elder?.name?.toLowerCase().includes(q) || false

        if (!matchName && !matchTopic && !matchNotes && !matchElder) return false
      }

      return true
    })
  }, [visits, statusFilter, elderFilter, groupFilter, searchQuery, publishers, groups])

  // Contadores de métricas
  const counts = useMemo(() => {
    let agendadas = 0
    let atrasadas = 0
    let realizadas = 0

    visits.forEach((v) => {
      const st = getDerivedVisitStatus(v)
      if (st === 'atrasada') atrasadas++
      else if (st === 'agendada') agendadas++
      else if (st === 'realizada') realizadas++
    })

    return { total: visits.length, agendadas, atrasadas, realizadas }
  }, [visits])

  // Dados para Visão de Calendário (agrupado por dia do mês selecionado)
  const calendarDaysMap = useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: Array<{
      dayNumber: number
      dateStr: string
      visits: PastoralVisit[]
    }> = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      const dayVisits = visits.filter((v) => {
        if (!v.scheduled_date) return false
        return v.scheduled_date.startsWith(dStr)
      })

      days.push({
        dayNumber: d,
        dateStr: dStr,
        visits: dayVisits,
      })
    }

    return { firstDayIndex, days, daysInMonth, month, year }
  }, [visits, calendarDate])

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  }
  const currentMonthToday = () => {
    setCalendarDate(new Date())
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in-up">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Visitas de Pastoreio</h1>
              <p className="text-muted-foreground text-sm">
                Agendamento, acompanhamento e registro pastoral de visitas pelo corpo de anciãos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={openNewVisitModal} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Agendar Visita
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total de Visitas</span>
              <Users className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{counts.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Registros cadastrados no sistema
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Agendadas (Próximas)</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{counts.agendadas}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Visitas marcadas com data futura
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Visitas Atrasadas</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">{counts.atrasadas}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Data passada sem registro de realização
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Realizadas</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {counts.realizadas}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Com observações e resumo pastoral
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Alternância de Visualização */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por irmão/família, pauta, ancião ou observações..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as 'lista' | 'calendario')}
                className="w-auto"
              >
                <TabsList className="grid grid-cols-2 w-[220px]">
                  <TabsTrigger value="lista" className="gap-1.5 text-xs">
                    <ListFilter className="h-3.5 w-3.5" /> Lista
                  </TabsTrigger>
                  <TabsTrigger value="calendario" className="gap-1.5 text-xs">
                    <CalendarDays className="h-3.5 w-3.5" /> Calendário
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Situação</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as 'todos' | 'agendada' | 'realizada' | 'atrasada')
                }
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as situações</SelectItem>
                  <SelectItem value="agendada">Agendadas</SelectItem>
                  <SelectItem value="atrasada">Atrasadas</SelectItem>
                  <SelectItem value="realizada">Realizadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ancião Responsável</Label>
              <Select value={elderFilter} onValueChange={setElderFilter}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Todos os anciãos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anciãos</SelectItem>
                  {eldersList.map((el) => (
                    <SelectItem key={el.id} value={el.id}>
                      {el.name} ({el.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Grupo de Serviço</Label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Todos os grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os grupos</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.number.toString()}>
                      Grupo {g.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo: Lista ou Calendário */}
      {viewMode === 'lista' ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Programação das Visitas de Pastoreio
                </CardTitle>
                <CardDescription>
                  Visível para todo o corpo de anciãos com histórico e observações
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredVisits.length} visita(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {filteredVisits.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <HeartHandshake className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma visita encontrada</p>
                <p className="text-xs mt-1">
                  Ajuste os filtros ou use o botão &quot;Agendar Visita&quot; para registrar uma
                  nova.
                </p>
              </div>
            ) : (
              filteredVisits.map((visit) => {
                const derivedStatus = getDerivedVisitStatus(visit)
                const scheduledDateFormatted = visit.scheduled_date
                  ? new Date(visit.scheduled_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : '—'

                const primaryElderObj = visit.expand?.primary_elder
                const publisherObj = visit.expand?.target_publisher
                const groupObj = publisherObj?.expand?.group_id

                // Mensagem e link WhatsApp
                const targetName = visit.target_family_name || publisherObj?.name || 'Irmão/Família'
                const waMessage = `Olá, irmão(ã) ${targetName}! Lembramos sobre a nossa visita de pastoreio com o corpo de anciãos agendada para ${scheduledDateFormatted}. Estamos ansiosos para estarmos juntos para nos encorajar mutuamente!`
                const waLink = buildWhatsAppLink(publisherObj?.phone, waMessage)

                return (
                  <div
                    key={visit.id}
                    className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-foreground">{targetName}</span>

                        {groupObj && (
                          <Badge variant="secondary" className="text-xs">
                            Grupo {groupObj.number}
                          </Badge>
                        )}

                        {derivedStatus === 'atrasada' && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" /> Atrasada
                          </Badge>
                        )}
                        {derivedStatus === 'agendada' && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300 bg-amber-50 text-xs gap-1"
                          >
                            <Clock className="h-3 w-3" /> Agendada
                          </Badge>
                        )}
                        {derivedStatus === 'realizada' && (
                          <Badge
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Realizada
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                          Data: {scheduledDateFormatted}
                        </span>

                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                          Responsável:{' '}
                          <strong>{primaryElderObj?.name || 'Ancião designado'}</strong>
                          {visit.expand?.responsible_elders &&
                            visit.expand.responsible_elders.length > 1 && (
                              <span>
                                {' '}
                                +{' '}
                                {visit.expand.responsible_elders
                                  .filter((e) => e.id !== visit.primary_elder)
                                  .map((e) => e.name)
                                  .join(', ')}
                              </span>
                            )}
                        </span>

                        {visit.completion_date && (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" />
                            Concluída em:{' '}
                            {new Date(visit.completion_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-foreground/90 mt-1">
                        <strong>Pauta:</strong> {visit.topic}
                      </p>

                      {/* Observações / Resumo Pós-visita (Visível para todo o corpo) */}
                      {visit.notes ? (
                        <div className="mt-2 p-2.5 rounded bg-muted/60 border border-muted text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span>Observações & Resumo do Corpo de Anciãos:</span>
                          </div>
                          <p className="italic text-foreground/90 pl-5 whitespace-pre-line">
                            &quot;{visit.notes}&quot;
                          </p>
                        </div>
                      ) : (
                        derivedStatus !== 'realizada' && (
                          <p className="text-[11px] text-muted-foreground italic mt-0.5">
                            Nenhuma anotação pós-visita registrada ainda.
                          </p>
                        )
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                      {publisherObj?.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        </Button>
                      )}

                      {derivedStatus !== 'realizada' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => openCompleteModal(visit)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(visit)}
                        title="Editar visita"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteVisit(visit.id)}
                        title="Excluir agendamento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      ) : (
        /* VISÃO DE CALENDÁRIO */
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-bold capitalize">
                  {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs ml-2"
                  onClick={currentMonthToday}
                >
                  Hoje
                </Button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Agendada
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Atrasada
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Realizada
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-muted-foreground mb-2">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            {/* Grid dos dias */}
            <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
              {/* Espaços em branco antes do primeiro dia */}
              {Array.from({ length: calendarDaysMap.firstDayIndex }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[90px] bg-muted/10 rounded-md p-1 border border-transparent"
                />
              ))}

              {calendarDaysMap.days.map((day) => {
                const isToday = new Date().toISOString().substring(0, 10) === day.dateStr

                return (
                  <div
                    key={day.dateStr}
                    className={`min-h-[100px] p-1.5 rounded-md border text-xs flex flex-col justify-between transition-colors ${
                      isToday
                        ? 'border-primary bg-primary/5 font-semibold'
                        : 'border-border/60 bg-card hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          isToday
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {day.visits.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {day.visits.length} vis.
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[85px]">
                      {day.visits.map((v) => {
                        const st = getDerivedVisitStatus(v)
                        const name =
                          v.target_family_name || v.expand?.target_publisher?.name || 'Visita'

                        return (
                          <div
                            key={v.id}
                            onClick={() => openEditModal(v)}
                            className={`p-1 rounded text-[11px] font-medium truncate cursor-pointer transition-opacity hover:opacity-80 ${
                              st === 'atrasada'
                                ? 'bg-rose-100 text-rose-800 border-l-2 border-rose-600'
                                : st === 'realizada'
                                  ? 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-600'
                                  : 'bg-amber-100 text-amber-800 border-l-2 border-amber-500'
                            }`}
                            title={`${name} - ${v.topic}`}
                          >
                            {name}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: CADASTRO / EDIÇÃO DE VISITA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVisit ? 'Editar Visita de Pastoreio' : 'Agendar Visita de Pastoreio'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Publicador ou Família a ser Visitada</Label>
              <Select
                value={formPublisherId}
                onValueChange={(val) => {
                  setFormPublisherId(val)
                  const p = publishers.find((pub) => pub.id === val)
                  if (p) setFormFamilyName(p.name)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o publicador na congregação" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">Nome Avulso / Família (sem vínculo)</SelectItem>
                  {publishers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.status ? `(${p.status})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(!formPublisherId || formPublisherId === '') && (
              <div className="space-y-2">
                <Label>Nome da Família / Pessoa</Label>
                <Input
                  placeholder="Ex: Família Souza / Irmão visitante"
                  value={formFamilyName}
                  onChange={(e) => setFormFamilyName(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data Prevista da Visita</Label>
                <Input
                  type="date"
                  value={formScheduledDate}
                  onChange={(e) => setFormScheduledDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Situação</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as VisitStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ancião Responsável (Principal)</Label>
                <Select value={formPrimaryElder} onValueChange={setFormPrimaryElder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ancião" />
                  </SelectTrigger>
                  <SelectContent>
                    {eldersList.map((el) => (
                      <SelectItem key={el.id} value={el.id}>
                        {el.name} ({el.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Companheiro (2º Ancião - Opcional)</Label>
                <Select value={formCompanionElder} onValueChange={setFormCompanionElder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum companheiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (Visita individual)</SelectItem>
                    {eldersList.map((el) => (
                      <SelectItem key={el.id} value={el.id}>
                        {el.name} ({el.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pauta da Visita (Motivo / Encorajamento / Apoio)</Label>
              <Input
                placeholder="Ex: Fortalecimento espiritual, retorno às reuniões, apoio à família..."
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
              />
            </div>

            {formStatus === 'realizada' && (
              <div className="space-y-2">
                <Label>Data de Realização</Label>
                <Input
                  type="date"
                  value={formCompletionDate}
                  onChange={(e) => setFormCompletionDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações / Resumo Pós-Visita (Visível para todo o corpo de anciãos)</Label>
              <Textarea
                rows={4}
                placeholder="Pontos abordados, textos bíblicos considerados, recepção da família e próximos passos combinados..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveVisit} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Visita'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CONCLUIR VISITA & REGISTRAR OBSERVAÇÕES */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Conclusão de Visita</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Confirmar visita realizada com{' '}
              <strong>
                {completingVisit?.target_family_name ||
                  completingVisit?.expand?.target_publisher?.name ||
                  'o irmão'}
              </strong>
              .
            </p>

            <div className="space-y-2">
              <Label>Data da Realização</Label>
              <Input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Resumo / Observações Pastorais</Label>
              <Textarea
                rows={5}
                placeholder="Como foi a visita? Quais textos bíblicos foram lidos? Houve algum pedido ou necessidade específica para o corpo de anciãos acompanhar?"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmCompletion}
                disabled={completing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {completing ? 'Registrando...' : 'Confirmar Realização'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
