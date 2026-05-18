import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
  type Publisher,
} from '@/services/publishers'
import { getGroups, type Group } from '@/services/groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Loader2, Pencil, Trash2, Eye, Users, BookOpen } from 'lucide-react'
import { MassEntryDialog } from '@/components/publishers/MassEntryDialog'
import { Link } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'

function calculateActivityStatus(
  pub: Publisher,
  reports: any[],
  currentMonth: number,
  currentYear: number,
) {
  if (!pub.active) return 'Inativo'

  const currentMonthStr = currentMonth.toString().padStart(2, '0')
  const thisMonthReport = reports.find(
    (r) => r.publisher_id === pub.id && r.month === currentMonthStr && r.year === currentYear,
  )

  if (thisMonthReport && (thisMonthReport.hours > 0 || thisMonthReport.participated)) {
    return 'Ativo'
  }

  let inactiveMonths = 0
  for (let i = 0; i < 6; i++) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) {
      m += 12
      y -= 1
    }
    const mStr = m.toString().padStart(2, '0')
    const rep = reports.find((r) => r.publisher_id === pub.id && r.month === mStr && r.year === y)

    if (!rep || (!rep.hours && !rep.participated)) {
      inactiveMonths++
    } else {
      break
    }
  }

  const createdDate = pub.created ? new Date(pub.created) : new Date()
  const sixMonthsAgo = new Date(currentYear, currentMonth - 1 - 6, 1)

  if (inactiveMonths >= 6 && createdDate < sixMonthsAgo) {
    return 'Inativo'
  }

  return 'Pendente'
}

export default function PublishersPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [reports6m, setReports6m] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Publisher>>({
    name: '',
    group_id: '',
    type: 'publicador',
    active: true,
    phone: '',
    address: '',
    notes: '',
    gender: undefined,
    hope: 'Outras ovelhas',
    birth_date: '',
    baptism_date: '',
    is_elder: false,
    is_ministerial_servant: false,
    is_special_pioneer: false,
    is_field_missionary: false,
  })
  const [isUnbaptized, setIsUnbaptized] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.role === 'Secretário') {
      loadData()
    }
  }, [user])

  useRealtime('publishers', () => {
    if (user?.role === 'Secretário') {
      loadData()
    }
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [pubs, grps] = await Promise.all([getPublishers(), getGroups()])
      setPublishers(pubs)
      setGroups(grps)

      const endY = new Date().getFullYear()
      const startY = endY - 1
      const reps = await pb.collection('publisher_reports').getFullList({
        filter: `year >= ${startY}`,
      })
      setReports6m(reps)
    } catch (e) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (pub?: Publisher) => {
    if (pub) {
      setEditingId(pub.id)
      setIsUnbaptized(!pub.baptism_date)
      setFormData({
        name: pub.name,
        group_id: pub.group_id,
        type: pub.type,
        active: pub.active,
        phone: pub.phone || '',
        address: pub.address || '',
        notes: pub.notes || '',
        gender: pub.gender,
        hope: pub.hope || 'Outras ovelhas',
        birth_date: pub.birth_date ? pub.birth_date.split('T')[0] : '',
        baptism_date: pub.baptism_date ? pub.baptism_date.split('T')[0] : '',
        is_elder: pub.is_elder,
        is_ministerial_servant: pub.is_ministerial_servant,
        is_special_pioneer: pub.is_special_pioneer,
        is_field_missionary: pub.is_field_missionary,
      })
    } else {
      setEditingId(null)
      setIsUnbaptized(false)
      setFormData({
        name: '',
        group_id: '',
        type: 'publicador',
        active: true,
        phone: '',
        address: '',
        notes: '',
        gender: undefined,
        hope: 'Outras ovelhas',
        birth_date: '',
        baptism_date: '',
        is_elder: false,
        is_ministerial_servant: false,
        is_special_pioneer: false,
        is_field_missionary: false,
      })
    }
    setOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.group_id || !formData.type) {
      return toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
    }

    const dataToSave = {
      ...formData,
      birth_date: formData.birth_date ? `${formData.birth_date} 12:00:00.000Z` : '',
      baptism_date: isUnbaptized
        ? ''
        : formData.baptism_date
          ? `${formData.baptism_date} 12:00:00.000Z`
          : '',
    }

    setSaving(true)
    try {
      if (editingId) {
        await updatePublisher(editingId, dataToSave)
        toast({ title: 'Publicador atualizado com sucesso!' })
      } else {
        await createPublisher(dataToSave)
        toast({ title: 'Publicador criado com sucesso!' })
      }
      setOpen(false)
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao salvar publicador', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este publicador?')) return
    try {
      await deletePublisher(id)
      toast({ title: 'Publicador excluído!' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  if (user?.role !== 'Secretário') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
      </div>
    )
  }

  const filtered = [...publishers]
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => filterGroup === 'all' || p.group_id === filterGroup)
    .filter((p) => filterType === 'all' || p.type === filterType)
    .sort((a, b) => a.name.localeCompare(b.name))

  const activeFiltered = filtered.filter((p) => p.active)
  const countTotal = activeFiltered.length
  const countAuxiliares = activeFiltered.filter((p) => p.type === 'pioneiro_auxiliar').length
  const countRegulares = activeFiltered.filter((p) => p.type === 'pioneiro_regular').length

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Publicadores</h1>
          <p className="text-muted-foreground mt-1">Gerencie os membros da congregação</p>
        </div>
        <div className="flex items-center gap-2">
          <MassEntryDialog groups={groups} onSaved={loadData} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Novo Publicador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Publicador' : 'Novo Publicador'}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="details">S-21-T / Detalhes</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="basic"
                  className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nome Completo</Label>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grupo</Label>
                      <Select
                        value={formData.group_id}
                        onValueChange={(v) => setFormData({ ...formData, group_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...groups]
                            .sort((a, b) => a.number - b.number)
                            .map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                Grupo {g.number}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Serviço</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="publicador">Publicador</SelectItem>
                          <SelectItem value="pioneiro_auxiliar">Pioneiro Auxiliar</SelectItem>
                          <SelectItem value="pioneiro_regular">Pioneiro Regular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sexo</Label>
                      <Select
                        value={formData.gender || ''}
                        onValueChange={(v: any) => setFormData({ ...formData, gender: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Endereço</Label>
                      <Input
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, número, bairro..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(c) => setFormData({ ...formData, active: c })}
                    />
                    <Label>Publicador Ativo</Label>
                  </div>
                </TabsContent>

                <TabsContent
                  value="details"
                  className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={formData.birth_date || ''}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Batismo</Label>
                      <Input
                        type="date"
                        value={formData.baptism_date || ''}
                        onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
                        disabled={isUnbaptized}
                      />
                      <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                        <Checkbox
                          checked={isUnbaptized}
                          onCheckedChange={(checked) => {
                            setIsUnbaptized(!!checked)
                            if (checked) setFormData({ ...formData, baptism_date: '' })
                          }}
                        />
                        <span className="text-sm font-medium">Publicador Não Batizado</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label>Esperança</Label>
                      <Select
                        value={formData.hope || ''}
                        onValueChange={(v: any) => setFormData({ ...formData, hope: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Outras ovelhas">Outras ovelhas</SelectItem>
                          <SelectItem value="Ungido">Ungido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 md:col-span-2 mt-2">
                      <Label className="text-base font-semibold">Designações / Privilégios</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={formData.is_elder}
                            onCheckedChange={(c) => setFormData({ ...formData, is_elder: !!c })}
                          />
                          <span className="text-sm">Ancião</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={formData.is_ministerial_servant}
                            onCheckedChange={(c) =>
                              setFormData({ ...formData, is_ministerial_servant: !!c })
                            }
                          />
                          <span className="text-sm">Servo ministerial</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={formData.is_special_pioneer}
                            onCheckedChange={(c) =>
                              setFormData({ ...formData, is_special_pioneer: !!c })
                            }
                          />
                          <span className="text-sm">Pioneiro especial</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={formData.is_field_missionary}
                            onCheckedChange={(c) =>
                              setFormData({ ...formData, is_field_missionary: !!c })
                            }
                          />
                          <span className="text-sm">Missionário em campo</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Informações adicionais..."
                        rows={2}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end pt-4 border-t mt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Publicadores</p>
              <h3 className="text-3xl font-bold mt-2">{countTotal}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pioneiros Auxiliares</p>
              <h3 className="text-3xl font-bold mt-2">{countAuxiliares}</h3>
            </div>
            <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pioneiros Regulares</p>
              <h3 className="text-3xl font-bold mt-2">{countRegulares}</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Todos os Grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Grupos</SelectItem>
                  {[...groups]
                    .sort((a, b) => a.number - b.number)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        Grupo {g.number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Todos os Tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="publicador">Publicador</SelectItem>
                  <SelectItem value="pioneiro_auxiliar">Pioneiro Auxiliar</SelectItem>
                  <SelectItem value="pioneiro_regular">Pioneiro Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Nenhum publicador encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((pub) => (
                      <TableRow key={pub.id}>
                        <TableCell className="font-medium">{pub.name}</TableCell>
                        <TableCell>{pub.phone || '-'}</TableCell>
                        <TableCell>Grupo {pub.expand?.group_id?.number || '-'}</TableCell>
                        <TableCell className="capitalize">{pub.type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          {(() => {
                            if (!pub.active)
                              return (
                                <Badge variant="secondary" className="text-slate-500">
                                  Desativado
                                </Badge>
                              )
                            const status = calculateActivityStatus(
                              pub,
                              reports6m,
                              new Date().getMonth() + 1,
                              new Date().getFullYear(),
                            )
                            if (status === 'Ativo')
                              return (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativo</Badge>
                              )
                            if (status === 'Pendente')
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-600"
                                  title="Mês corrente"
                                >
                                  Pendente (Mês atual)
                                </Badge>
                              )
                            return <Badge variant="destructive">Inativo (6m)</Badge>
                          })()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/publishers/${pub.id}`}>
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pub)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(pub.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
