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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Loader2, Pencil, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'

function calculateActivityStatus(
  publisherId: string,
  reports: any[],
  currentMonth: number,
  currentYear: number,
) {
  const currentMonthStr = currentMonth.toString().padStart(2, '0')
  const thisMonthReport = reports.find(
    (r) => r.publisher_id === publisherId && r.month === currentMonthStr && r.year === currentYear,
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
    const rep = reports.find(
      (r) => r.publisher_id === publisherId && r.month === mStr && r.year === y,
    )

    if (!rep || (!rep.hours && !rep.participated)) {
      inactiveMonths++
    } else {
      break
    }
  }

  if (inactiveMonths >= 6) {
    return 'Inativo'
  }

  return 'Não Participou'
}

export default function PublishersPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [reports6m, setReports6m] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
  })
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
      setFormData({
        name: pub.name,
        group_id: pub.group_id,
        type: pub.type,
        active: pub.active,
        phone: pub.phone || '',
        address: pub.address || '',
        notes: pub.notes || '',
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        group_id: '',
        type: 'publicador',
        active: true,
        phone: '',
        address: '',
        notes: '',
      })
    }
    setOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.group_id || !formData.type) {
      return toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
    }

    setSaving(true)
    try {
      if (editingId) {
        await updatePublisher(editingId, formData)
        toast({ title: 'Publicador atualizado com sucesso!' })
      } else {
        await createPublisher(formData)
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

  const filtered = publishers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Publicadores</h1>
          <p className="text-muted-foreground mt-1">Gerencie os membros da congregação</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Novo Publicador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Publicador' : 'Novo Publicador'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>Nome</Label>
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
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        Grupo {g.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
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
                <Label>Endereço</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro..."
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(c) => setFormData({ ...formData, active: c })}
                />
                <Label>Publicador Ativo</Label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
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
                              pub.id,
                              reports6m,
                              new Date().getMonth() + 1,
                              new Date().getFullYear(),
                            )
                            if (status === 'Ativo')
                              return (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativo</Badge>
                              )
                            if (status === 'Não Participou')
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-600"
                                >
                                  Não Participou
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
