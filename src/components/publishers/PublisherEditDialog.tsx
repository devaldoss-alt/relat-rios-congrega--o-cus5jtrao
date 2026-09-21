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
  const [elderApprovalConfirmed, setElderApprovalConfirmed] = useState(false)

  useEffect(() => {
    if (publisher && open) {
      setIsUnbaptized(!publisher.baptism_date)
      const readmissionVal = publisher.readmission_date
        ? publisher.readmission_date.split('T')[0]
        : ''
      setElderApprovalConfirmed(Boolean(readmissionVal))
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
        is_deaf: publisher.is_deaf,
        is_blind: publisher.is_blind,
        is_prisoner: publisher.is_prisoner,
        readmission_date: readmissionVal,
        status: publisher.status || (publisher.active ? 'Ativo' : 'Inativo (Apoio)'),
        notes: publisher.notes || '',
      })
    }
  }, [publisher, open])

  const handleChange = (field: keyof Publisher, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!publisher) return

    // Validação estrita para Data de Readmissão:
    if (formData.readmission_date) {
      if (!elderApprovalConfirmed) {
        toast({
          title: 'Confirmação obrigatória',
          description: 'A readmissão exige confirmação de aprovação formal do corpo de anciãos.',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    try {
      // Ao salvar com readmissão preenchida, o status deve ser 'Ativo' para contar novamente
      const statusToSave = formData.readmission_date
        ? formData.status === 'Removido'
          ? 'Ativo'
          : formData.status
        : formData.status

      const dataToSave = {
        ...formData,
        status: statusToSave,
        active: statusToSave === 'Ativo' || statusToSave === 'Inativo (Apoio)',
        birth_date: formData.birth_date ? `${formData.birth_date} 12:00:00.000Z` : '',
        baptism_date: isUnbaptized
          ? ''
          : formData.baptism_date
            ? `${formData.baptism_date} 12:00:00.000Z`
            : '',
        readmission_date: formData.readmission_date
          ? `${formData.readmission_date} 12:00:00.000Z`
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

          <div className="space-y-3 mt-4">
            <Label className="text-base font-semibold">Situações Especiais / Análise (S-10)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-lg bg-muted/30">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_deaf}
                  onCheckedChange={(c) => handleChange('is_deaf', !!c)}
                />
                <span className="text-sm">Surdo (Língua de sinais)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_blind}
                  onCheckedChange={(c) => handleChange('is_blind', !!c)}
                />
                <span className="text-sm">Cego</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={formData.is_prisoner}
                  onCheckedChange={(c) => handleChange('is_prisoner', !!c)}
                />
                <span className="text-sm">Preso</span>
              </label>
            </div>
            <div className="space-y-3 pt-2 rounded-md border p-3 bg-muted/20">
              <div>
                <Label className="font-semibold text-sm">
                  Data de Readmissão (Exclusivo para Reintegração Formal)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  <strong>Atenção:</strong> Preencha <em>apenas</em> se o publicador havia sido
                  removido (desassociado) e foi formalmente reintegrado após aprovação do corpo de
                  anciãos. <strong>Nunca use para inativos reativados</strong>.
                </p>
              </div>
              <Input
                type="date"
                value={formData.readmission_date || ''}
                onChange={(e) => {
                  const val = e.target.value
                  handleChange('readmission_date', val)
                  if (val) {
                    // Sugere status ativo caso estivesse como Removido
                    if (formData.status === 'Removido') {
                      handleChange('status', 'Ativo')
                    }
                  } else {
                    setElderApprovalConfirmed(false)
                  }
                }}
              />

              {formData.readmission_date && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md space-y-2">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <Checkbox
                      checked={elderApprovalConfirmed}
                      onCheckedChange={(c) => setElderApprovalConfirmed(!!c)}
                      className="mt-0.5"
                    />
                    <span className="text-xs font-medium text-amber-950 dark:text-amber-200 leading-snug">
                      Confirmo que houve aprovação formal do corpo de anciãos para esta readmissão e
                      que a pessoa volta a contar como publicador ativo a partir desta data.
                    </span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Ao registrar a data, o status do publicador é ajustado para "Ativo" e a contagem
                    do S-10 da congregação registrará a readmissão automaticamente.
                  </p>
                </div>
              )}
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
