import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getPublishersByGroup } from '@/services/publishers'
import { getPublisherReports, saveMultiplePublisherReports } from '@/services/publisher_reports'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Table2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

export function MassEntryDialog({ groups, onSaved }: { groups: any[]; onSaved: () => void }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const years = Array.from({ length: 3 }, (_, i) => (new Date().getFullYear() - 1 + i).toString())

  useEffect(() => {
    if (selectedGroup && selectedMonth && selectedYear && open) {
      loadData()
    } else {
      setRows([])
      setErrors({})
    }
  }, [selectedGroup, selectedMonth, selectedYear, open])

  const loadData = async () => {
    setLoading(true)
    try {
      const pubs = await getPublishersByGroup(selectedGroup)
      const reps = await getPublisherReports(selectedGroup, selectedMonth, parseInt(selectedYear))

      const newRows = pubs
        .filter(
          (p) => p.status === 'Ativo' || p.status === 'Inativo (Apoio)' || (!p.status && p.active),
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => {
          const rep = reps.find((r) => r.publisher_id === p.id)
          return {
            publisher_id: p.id,
            name: p.name,
            report_id: rep?.id,
            hours: rep?.hours?.toString() || '',
            bible_studies: rep?.bible_studies?.toString() || '',
          }
        })
      setRows(newRows)
    } catch (e) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows]
    newRows[index][field] = value
    setRows(newRows)

    if (errors[`${index}-${field}`]) {
      const newErrors = { ...errors }
      delete newErrors[`${index}-${field}`]
      setErrors(newErrors)
    }
  }

  const handleSave = async () => {
    if (!selectedGroup || !selectedMonth || !selectedYear) {
      toast({ title: 'Selecione o grupo, mês e ano.', variant: 'destructive' })
      return
    }

    let hasError = false
    const newErrors: Record<string, string> = {}

    rows.forEach((r, i) => {
      if (r.hours && !/^\d+$/.test(r.hours)) {
        newErrors[`${i}-hours`] = 'Inválido'
        hasError = true
      }
      if (r.bible_studies && !/^\d+$/.test(r.bible_studies)) {
        newErrors[`${i}-bible_studies`] = 'Inválido'
        hasError = true
      }
    })

    if (hasError) {
      setErrors(newErrors)
      toast({ title: 'Verifique os campos inválidos', variant: 'destructive' })
      return
    }

    const toSave = rows
      .map((r) => {
        const hours = parseInt(r.hours || '0', 10)
        const bible_studies = parseInt(r.bible_studies || '0', 10)
        return {
          id: r.report_id,
          publisher_id: r.publisher_id,
          month: selectedMonth,
          year: parseInt(selectedYear),
          hours,
          bible_studies,
          participated: hours > 0 || bible_studies > 0,
        }
      })
      .filter((r) => r.hours > 0 || r.bible_studies > 0 || r.id)

    if (toSave.length === 0) {
      toast({ title: 'Nenhum dado para salvar' })
      return
    }

    setSaving(true)
    try {
      await saveMultiplePublisherReports(toSave)
      toast({ title: 'Relatórios salvos com sucesso!' })
      onSaved()
      setOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar relatórios', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Table2 className="mr-2 h-4 w-4" /> Entrada em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Entrada em Massa de Relatórios</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 shrink-0">
          <div className="space-y-2">
            <Label>Grupo</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
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
            <Label>Mês</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-md min-h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Publicador</TableHead>
                <TableHead className="w-[150px]">Horas</TableHead>
                <TableHead className="w-[150px]">Estudos Bíblicos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    {!selectedGroup || !selectedMonth
                      ? 'Selecione grupo e mês para continuar.'
                      : 'Nenhum publicador ativo neste grupo.'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={row.publisher_id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={row.hours}
                        onChange={(e) => handleRowChange(i, 'hours', e.target.value)}
                        className={
                          errors[`${i}-hours`]
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                        }
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={row.bible_studies}
                        onChange={(e) => handleRowChange(i, 'bible_studies', e.target.value)}
                        className={
                          errors[`${i}-bible_studies`]
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                        }
                        placeholder="0"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedGroup || !selectedMonth || rows.length === 0}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Relatórios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
