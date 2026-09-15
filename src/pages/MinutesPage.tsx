import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
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
} from '@/components/ui/dialog'
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  CheckSquare,
  Search,
  MessageCircle,
  FileCheck2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getMeetingMinutes,
  createMeetingMinute,
  deleteMeetingMinute,
  getMinutesActions,
  createMinuteAction,
  updateMinuteAction,
  deleteMinuteAction,
  MeetingMinute,
  MinuteAction,
  ActionStatus,
  ActionPriority,
} from '@/services/minutes_actions'
import { buildWhatsAppLink } from '@/services/alerts'
import pb from '@/lib/pocketbase/client'
import { GuideDialog } from '@/components/GuideDialog'

export default function MinutesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isSecretary = user?.role === 'Secretário'

  const [minutes, setMinutes] = useState<MeetingMinute[]>([])
  const [actions, setActions] = useState<MinuteAction[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros de ações
  const [actionFilter, setActionFilter] = useState<'minhas' | 'todas' | 'pendentes' | 'concluidas'>(
    'todas',
  )
  const [searchAction, setSearchAction] = useState('')

  // Modal de Nova Ata
  const [isMinuteModalOpen, setIsMinuteModalOpen] = useState(false)
  const [minuteTitle, setMinuteTitle] = useState('')
  const [minuteDate, setMinuteDate] = useState(new Date().toISOString().split('T')[0])
  const [minuteText, setMinuteText] = useState('')
  const [minuteFile, setMinuteFile] = useState<File | null>(null)
  const [savingMinute, setSavingMinute] = useState(false)

  // Modal de Nova Ação
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [actionTitle, setActionTitle] = useState('')
  const [actionDesc, setActionDesc] = useState('')
  const [actionAssignee, setActionAssignee] = useState<string>('')
  const [actionDueDate, setActionDueDate] = useState('')
  const [actionPriority, setActionPriority] = useState<ActionPriority>('media')
  const [actionMinuteId, setActionMinuteId] = useState<string>('')
  const [savingAction, setSavingAction] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [allMinutes, allActions, allUsers] = await Promise.all([
        getMeetingMinutes(),
        getMinutesActions(),
        pb.collection('users').getFullList(),
      ])
      setMinutes(allMinutes)
      setActions(allActions)
      setUsers(allUsers)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar atas',
        description: 'Não foi possível carregar os dados de atas e ações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveMinute = async () => {
    if (!minuteTitle || !minuteDate) {
      return toast({ title: 'Preencha o título e a data da reunião', variant: 'destructive' })
    }

    setSavingMinute(true)
    try {
      const formData = new FormData()
      formData.append('title', minuteTitle)
      formData.append('meeting_date', minuteDate)
      if (minuteText) formData.append('raw_content', minuteText)
      if (minuteFile) formData.append('attachment', minuteFile)
      if (user?.id) formData.append('created_by', user.id)

      await createMeetingMinute(formData)
      toast({ title: 'Ata registrada com sucesso!' })
      setIsMinuteModalOpen(false)
      setMinuteTitle('')
      setMinuteText('')
      setMinuteFile(null)
      loadData()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar ata', variant: 'destructive' })
    } finally {
      setSavingMinute(false)
    }
  }

  const handleDeleteMinute = async (id: string) => {
    if (!confirm('Deseja excluir esta ata?')) return
    try {
      await deleteMeetingMinute(id)
      toast({ title: 'Ata excluída com sucesso!' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao excluir ata', variant: 'destructive' })
    }
  }

  const handleSaveAction = async () => {
    if (!actionTitle) {
      return toast({ title: 'O título da ação é obrigatório', variant: 'destructive' })
    }

    setSavingAction(true)
    try {
      const assignedUser = users.find((u) => u.id === actionAssignee)
      await createMinuteAction({
        title: actionTitle,
        description: actionDesc,
        assigned_to: actionAssignee || undefined,
        assigned_name: assignedUser?.name || undefined,
        group_number: assignedUser?.group_number || undefined,
        due_date: actionDueDate ? `${actionDueDate} 23:59:59.000Z` : undefined,
        status: 'pendente',
        priority: actionPriority,
        minute_id: actionMinuteId || undefined,
      })
      toast({ title: 'Item de ação criado com sucesso!' })
      setIsActionModalOpen(false)
      setActionTitle('')
      setActionDesc('')
      setActionAssignee('')
      setActionDueDate('')
      setActionMinuteId('')
      loadData()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao criar ação', variant: 'destructive' })
    } finally {
      setSavingAction(false)
    }
  }

  const handleUpdateActionStatus = async (action: MinuteAction, newStatus: ActionStatus) => {
    try {
      await updateMinuteAction(action.id, {
        status: newStatus,
        completed_at: newStatus === 'concluido' ? new Date().toISOString() : undefined,
      })
      toast({ title: `Ação marcada como ${newStatus}` })
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao atualizar ação', variant: 'destructive' })
    }
  }

  const handleDeleteAction = async (id: string) => {
    if (!confirm('Deseja excluir este item de ação?')) return
    try {
      await deleteMinuteAction(id)
      toast({ title: 'Ação excluída!' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao excluir ação', variant: 'destructive' })
    }
  }

  // Filtragem de ações
  const filteredActions = actions.filter((act) => {
    if (searchAction) {
      const matchTitle = act.title.toLowerCase().includes(searchAction.toLowerCase())
      const matchDesc = act.description?.toLowerCase().includes(searchAction.toLowerCase())
      const matchAssignee = act.assigned_name?.toLowerCase().includes(searchAction.toLowerCase())
      if (!matchTitle && !matchDesc && !matchAssignee) return false
    }

    if (actionFilter === 'minhas') {
      return act.assigned_to === user?.id
    }
    if (actionFilter === 'pendentes') {
      return act.status === 'pendente' || act.status === 'em_andamento'
    }
    if (actionFilter === 'concluidas') {
      return act.status === 'concluido'
    }
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Atas & Plano de Ação</h1>
              <p className="text-muted-foreground text-sm">
                Registro de reuniões de anciãos e acompanhamento de designações e prazos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <GuideDialog />
          {isSecretary && (
            <Dialog open={isMinuteModalOpen} onOpenChange={setIsMinuteModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Nova Ata / Decisões
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Registrar Ata de Reunião de Anciãos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Título / Referência</Label>
                    <Input
                      placeholder="Ex: Reunião Trimestral de Anciãos - 1º Semestre"
                      value={minuteTitle}
                      onChange={(e) => setMinuteTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data da Reunião</Label>
                    <Input
                      type="date"
                      value={minuteDate}
                      onChange={(e) => setMinuteDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Texto das Decisões / Resumo da Reunião (ou colar do WhatsApp)</Label>
                    <Textarea
                      rows={6}
                      placeholder="Cole aqui o texto com as decisões tomadas, designações e pontos acordados pelo corpo de anciãos..."
                      value={minuteText}
                      onChange={(e) => setMinuteText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anexo (Opcional - PDF ou Foto do Documento)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.docx"
                      onChange={(e) => setMinuteFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsMinuteModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveMinute} disabled={savingMinute}>
                      {savingMinute ? 'Salvando...' : 'Salvar Ata'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
            <DialogTrigger asChild>
              <Button variant={isSecretary ? 'outline' : 'default'} className="gap-2">
                <CheckSquare className="h-4 w-4" /> Nova Ação / Designação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Item de Plano de Ação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Título da Tarefa</Label>
                  <Input
                    placeholder="Ex: Agendar visita de pastoreio com o irmão..."
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição / Orientações</Label>
                  <Textarea
                    rows={3}
                    placeholder="Detalhes ou acordos definidos pelo corpo de anciãos..."
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Select value={actionAssignee} onValueChange={setActionAssignee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={actionPriority}
                      onValueChange={(v) => setActionPriority(v as ActionPriority)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Prazo de Conclusão</Label>
                  <Input
                    type="date"
                    value={actionDueDate}
                    onChange={(e) => setActionDueDate(e.target.value)}
                  />
                </div>

                {minutes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Vincular a uma Ata (Opcional)</Label>
                    <Select value={actionMinuteId} onValueChange={setActionMinuteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma (Ação avulsa)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma (Ação avulsa)</SelectItem>
                        {minutes.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title} ({m.meeting_date?.substring(0, 10)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveAction} disabled={savingAction}>
                    {savingAction ? 'Salvando...' : 'Salvar Ação'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="actions" className="space-y-6">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="actions" className="gap-2">
            <CheckSquare className="h-4 w-4" /> Plano de Ação (
            {actions.filter((a) => a.status !== 'concluido').length})
          </TabsTrigger>
          <TabsTrigger value="minutes" className="gap-2">
            <FileText className="h-4 w-4" /> Atas Registradas ({minutes.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA: PLANO DE AÇÃO */}
        <TabsContent value="actions" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={actionFilter === 'todas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionFilter('todas')}
              >
                Todas ({actions.length})
              </Button>
              <Button
                variant={actionFilter === 'minhas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionFilter('minhas')}
              >
                Minhas Designações ({actions.filter((a) => a.assigned_to === user?.id).length})
              </Button>
              <Button
                variant={actionFilter === 'pendentes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionFilter('pendentes')}
              >
                Pendentes (
                {
                  actions.filter((a) => a.status === 'pendente' || a.status === 'em_andamento')
                    .length
                }
                )
              </Button>
              <Button
                variant={actionFilter === 'concluidas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActionFilter('concluidas')}
              >
                Concluídas ({actions.filter((a) => a.status === 'concluido').length})
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar ação..."
                value={searchAction}
                onChange={(e) => setSearchAction(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {filteredActions.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum item de ação encontrado</p>
                <p className="text-xs mt-1">
                  Crie uma nova ação para acompanhar designações do corpo de anciãos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActions.map((act) => {
                const assignedUser = users.find((u) => u.id === act.assigned_to)
                const isOverdue =
                  act.due_date && new Date(act.due_date) < new Date() && act.status !== 'concluido'

                return (
                  <Card
                    key={act.id}
                    className={`shadow-xs border transition-all ${
                      act.status === 'concluido'
                        ? 'opacity-70 bg-muted/20 border-muted'
                        : isOverdue
                          ? 'border-destructive/40 bg-destructive/5'
                          : 'bg-card'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold leading-tight flex items-center gap-2">
                            {act.title}
                          </CardTitle>
                          {act.description && (
                            <CardDescription className="text-xs text-foreground/80 line-clamp-2">
                              {act.description}
                            </CardDescription>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant={
                              act.status === 'concluido'
                                ? 'default'
                                : act.status === 'em_andamento'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="text-xs capitalize"
                          >
                            {act.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant={
                              act.priority === 'urgente' || act.priority === 'alta'
                                ? 'destructive'
                                : 'outline'
                            }
                            className="text-[10px] uppercase font-mono"
                          >
                            {act.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground pt-1 border-t">
                        <span>
                          <strong>Responsável:</strong> {act.assigned_name || 'Corpo de Anciãos'}
                        </span>
                        {act.due_date && (
                          <span
                            className={`flex items-center gap-1 font-mono ${
                              isOverdue ? 'text-destructive font-bold' : ''
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            {act.due_date.substring(0, 10)}
                            {isOverdue && ' (Atrasada)'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1">
                          {act.status !== 'concluido' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 gap-1"
                              onClick={() => handleUpdateActionStatus(act, 'concluido')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => handleUpdateActionStatus(act, 'pendente')}
                            >
                              Reabrir
                            </Button>
                          )}

                          {assignedUser?.phone && (
                            <a
                              href={buildWhatsAppLink(
                                assignedUser.phone,
                                `Olá, irmão ${assignedUser.name}! Lembrete do corpo de anciãos sobre a ação: "${act.title}". Prazo: ${act.due_date?.substring(0, 10) || 'a definir'}.`,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-7 px-2 text-xs flex items-center gap-1 text-emerald-600 hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> Cobrar/Avisar
                            </a>
                          )}
                        </div>

                        {isSecretary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteAction(act.id)}
                          >
                            Excluir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ABA: ATAS REGISTRADAS */}
        <TabsContent value="minutes" className="space-y-4">
          {minutes.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma ata registrada</p>
                <p className="text-xs mt-1">
                  O secretário pode cadastrar atas ou decisões coladas do grupo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {minutes.map((min) => {
                const actionsFromMinute = actions.filter((a) => a.minute_id === min.id)
                const fileUrl = min.attachment ? pb.files.getURL(min, min.attachment) : null

                return (
                  <Card key={min.id} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <CardTitle className="text-lg font-bold">{min.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 text-xs mt-0.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(min.meeting_date).toLocaleDateString('pt-BR')} • Registrado
                            por {min.expand?.created_by?.name || 'Secretário'}
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                          {fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="gap-1.5 h-8 text-xs"
                            >
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                <Paperclip className="h-3.5 w-3.5" /> Anexo
                              </a>
                            </Button>
                          )}
                          {isSecretary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteMinute(min.id)}
                            >
                              Excluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {min.raw_content && (
                        <div className="bg-muted/40 p-4 rounded-lg text-sm whitespace-pre-wrap font-sans leading-relaxed border">
                          {min.raw_content}
                        </div>
                      )}

                      {/* Ações originadas desta ata */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5" />
                          Plano de Ação Definido ({actionsFromMinute.length})
                        </h4>
                        {actionsFromMinute.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            Nenhuma designação individual vinculada a esta ata.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {actionsFromMinute.map((act) => (
                              <div
                                key={act.id}
                                className="p-2.5 rounded border bg-card text-xs flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-medium text-foreground">{act.title}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {act.assigned_name || 'Não atribuído'} • Prazo:{' '}
                                    {act.due_date?.substring(0, 10) || '—'}
                                  </p>
                                </div>
                                <Badge
                                  variant={act.status === 'concluido' ? 'default' : 'outline'}
                                  className="text-[10px] capitalize"
                                >
                                  {act.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
