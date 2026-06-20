import { useState, useEffect } from 'react'
import { Publisher, updatePublisher } from '@/services/publishers'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Props {
  publisher: Publisher | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (pub: Publisher) => void
}

export function PublisherEditDialog({ publisher, open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Publisher>>({})
  const [isUnbaptized, setIsUnbaptized] = useState(false)

  useEffect(() => {
    if (publisher && open) {
      setIsUnbaptized(!publisher.baptism_date)
      setFormData({
        name: publisher.name,
        birth_date: publisher.birth_date ? publisher.birth_date.split('T')[0] : '',
        baptism_date: publisher.baptism_date ? publisher.baptism_date.split('T')[0] : '',
        gender: publisher.gender,
        hope: publisher.hope,
        is_elder: publisher.is_elder,
        is_ministerial_servant: publisher.is_ministerial_servant,
        is_special_pioneer: publisher.is_special_pioneer,
        is_field_missionary: publisher.is_field_missionary,
        status: publisher.status || (publisher.active ? 'Ativo' : 'Inativo (Apoio)'),
      })
    }
  }, [publisher, open])

  const handleChange = (field: keyof Publisher, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!publisher) return
    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        active: formData.status === 'Ativo' || formData.status === 'Inativo (Apoio)',
        birth_date: formData.birth_date ? `${formData.birth_date} 12:00:00.000Z` : '',
        baptism_date: isUnbaptized
          ? ''
          : formData.baptism_date
            ? `${formData.baptism_date} 12:00:00.000Z`
            : '',
      }
      const updated = await updatePublisher(publisher.id, dataToSave)
      toast({ title: 'Publicador atualizado', description: 'Os dados foram salvos com sucesso.' })
      onSaved(updated)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Verifique os dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Publicador (S-21-T)</DialogTitle>
          <DialogDescription>Atualize os dados pessoais e designações.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select
                value={formData.gender || ''}
                onValueChange={(v) => handleChange('gender', v)}
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
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => handleChange('birth_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Batismo</Label>
              <Input
                type="date"
                value={formData.baptism_date || ''}
                onChange={(e) => handleChange('baptism_date', e.target.value)}
                disabled={isUnbaptized}
              />
              <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                <Checkbox
                  checked={isUnbaptized}
                  onCheckedChange={(checked) => {
                    setIsUnbaptized(!!checked)
                    if (checked) handleChange('baptism_date', '')
                  }}
                />
                <span className="text-sm font-medium">Publicador Não Batizado</span>
              </label>
            </div>
            <div className="space-y-2">
              <Label>Status na Congregação</Label>
              <Select
                value={formData.status || 'Ativo'}
                onValueChange={(v) => handleChange('status', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo (Apoio)">Inativo (Apoio)</SelectItem>
                  <SelectItem value="Mudou-se">Mudou-se</SelectItem>
                  <SelectItem value="Removido">Removido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Esperança</Label>
              <Select value={formData.hope || ''} onValueChange={(v) => handleChange('hope', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Outras ovelhas">Outras ovelhas</SelectItem>
                  <SelectItem value="Ungido">Ungido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <Label className="text-base font-semibold">Designações / Privilégios</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_elder}
                  onCheckedChange={(c) => handleChange('is_elder', !!c)}
                />
                <span className="text-sm">Ancião</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_ministerial_servant}
                  onCheckedChange={(c) => handleChange('is_ministerial_servant', !!c)}
                />
                <span className="text-sm">Servo ministerial</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_special_pioneer}
                  onCheckedChange={(c) => handleChange('is_special_pioneer', !!c)}
                />
                <span className="text-sm">Pioneiro especial</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_field_missionary}
                  onCheckedChange={(c) => handleChange('is_field_missionary', !!c)}
                />
                <span className="text-sm">Missionário em campo</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
