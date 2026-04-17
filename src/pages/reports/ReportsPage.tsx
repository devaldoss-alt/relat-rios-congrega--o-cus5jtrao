import { useEffect, useState } from 'react'
import { getReports, createReport, deleteReport } from '@/services/reports'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    meeting_date: '',
    type: '',
    attendance: '',
    visitors: '0',
    notes: '',
  })

  const loadData = async () => {
    const data = await getReports()
    setReports(data)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('reports', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createReport({
        meeting_date: new Date(formData.meeting_date).toISOString(),
        type: formData.type,
        attendance: parseInt(formData.attendance),
        visitors: parseInt(formData.visitors) || 0,
        notes: formData.notes,
      })
      toast.success('Relatório criado com sucesso')
      setIsOpen(false)
      setFormData({ meeting_date: '', type: '', attendance: '', visitors: '0', notes: '' })
    } catch (err: any) {
      toast.error('Erro ao criar relatório')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Relatórios de Reunião</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Relatório</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Reunião</Label>
                  <Input
                    type="datetime-local"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Culto de Domingo">Culto de Domingo</SelectItem>
                      <SelectItem value="Reunião de Oração">Reunião de Oração</SelectItem>
                      <SelectItem value="Jovens">Jovens</SelectItem>
                      <SelectItem value="Estudo Bíblico">Estudo Bíblico</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Público Total</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.attendance}
                    onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visitantes</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.visitors}
                    onChange={(e) => setFormData({ ...formData, visitors: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Salvar Relatório
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Público</TableHead>
                <TableHead className="text-right">Visitantes</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {new Date(report.meeting_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{report.type}</TableCell>
                  <TableCell className="text-right">{report.attendance}</TableCell>
                  <TableCell className="text-right">{report.visitors}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteReport(report.id).catch(() => toast.error('Erro ao excluir'))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum relatório encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
