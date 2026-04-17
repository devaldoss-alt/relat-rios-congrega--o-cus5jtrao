import { useEffect, useState } from 'react'
import { getMembers, createMember, deleteMember } from '@/services/members'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Phone, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    status: 'Ativo',
    phone: '',
    baptism_date: '',
  })

  const loadData = async () => setMembers(await getMembers())

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('members', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data: any = { ...formData }
      if (data.baptism_date) {
        data.baptism_date = new Date(data.baptism_date).toISOString()
      } else {
        delete data.baptism_date
      }
      await createMember(data)
      toast.success('Membro cadastrado')
      setIsOpen(false)
      setFormData({ name: '', status: 'Ativo', phone: '', baptism_date: '' })
    } catch (err: any) {
      toast.error('Erro ao cadastrar membro')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Inativo':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'Visitante':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Membros</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Membro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Visitante">Visitante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de Batismo (Opcional)</Label>
                <Input
                  type="date"
                  value={formData.baptism_date}
                  onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Salvar Membro
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => (
          <Card
            key={member.id}
            className="shadow-subtle hover:shadow-elevation transition-shadow group"
          >
            <CardContent className="p-6 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMember(member.id).catch(() => toast.error('Erro ao excluir'))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-20 w-20 border-2 border-muted">
                  <AvatarImage src={`https://img.usecurling.com/ppl/medium?seed=${member.id}`} />
                  <AvatarFallback className="text-xl">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg leading-tight truncate px-2">
                    {member.name}
                  </h3>
                  <Badge variant="outline" className={`mt-1.5 ${getStatusColor(member.status)}`}>
                    {member.status}
                  </Badge>
                </div>
                <div className="w-full space-y-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="truncate">{member.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="truncate">
                      {member.baptism_date
                        ? new Date(member.baptism_date).toLocaleDateString('pt-BR')
                        : 'Não batizado'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {members.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhum membro cadastrado.
        </div>
      )}
    </div>
  )
}
