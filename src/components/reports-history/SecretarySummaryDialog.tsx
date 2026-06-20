import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Printer, Pencil, Loader2, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { updateMonthlySummary, type MonthlySummary } from '@/services/monthly_summaries'

const MONTHS: Record<string, string> = {
  '01': 'Janeiro',
  '1': 'Janeiro',
  '02': 'Fevereiro',
  '2': 'Fevereiro',
  '03': 'Março',
  '3': 'Março',
  '04': 'Abril',
  '4': 'Abril',
  '05': 'Maio',
  '5': 'Maio',
  '06': 'Junho',
  '6': 'Junho',
  '07': 'Julho',
  '7': 'Julho',
  '08': 'Agosto',
  '8': 'Agosto',
  '09': 'Setembro',
  '9': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
}

interface Props {
  summary: MonthlySummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function SecretarySummaryDialog({ summary, open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>(null)

  const initFormData = () => {
    if (!summary) return
    setFormData({
      total_active_publishers: summary.total_active_publishers || 0,
      avg_attendance_midweek: summary.avg_attendance_midweek || 0,
      avg_attendance_weekend: summary.avg_attendance_weekend || 0,
      attendance_goal: summary.attendance_goal || 0,
      publishers_reports: summary.report_data?.publishers?.reports || 0,
      publishers_hours: summary.report_data?.publishers?.hours || 0,
      publishers_studies: summary.report_data?.publishers?.studies || 0,
      auxiliary_reports: summary.report_data?.auxiliary?.reports || 0,
      auxiliary_hours: summary.report_data?.auxiliary?.hours || 0,
      auxiliary_studies: summary.report_data?.auxiliary?.studies || 0,
      regular_reports: summary.report_data?.regular?.reports || 0,
      regular_hours: summary.report_data?.regular?.hours || 0,
      regular_studies: summary.report_data?.regular?.studies || 0,
    })
  }

  useEffect(() => {
    if (summary && open) {
      initFormData()
      setIsEditing(false)
    }
  }, [summary, open])

  if (!summary || !formData) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((p: any) => ({
      ...p,
      [name]: value === '' ? 0 : Math.max(0, parseInt(value) || 0),
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateMonthlySummary(summary.id, {
        total_active_publishers: formData.total_active_publishers,
        avg_attendance_midweek: formData.avg_attendance_midweek,
        avg_attendance_weekend: formData.avg_attendance_weekend,
        attendance_goal: formData.attendance_goal,
        report_data: {
          publishers: {
            reports: formData.publishers_reports,
            hours: formData.publishers_hours,
            studies: formData.publishers_studies,
          },
          auxiliary: {
            reports: formData.auxiliary_reports,
            hours: formData.auxiliary_hours,
            studies: formData.auxiliary_studies,
          },
          regular: {
            reports: formData.regular_reports,
            hours: formData.regular_hours,
            studies: formData.regular_studies,
          },
        },
      })
      toast({ title: 'Sucesso', description: 'Relatório atualizado com sucesso.' })
      setIsEditing(false)
      onSaved()
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o relatório.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    initFormData()
  }

  const totals = {
    reports: formData.publishers_reports + formData.auxiliary_reports + formData.regular_reports,
    hours: formData.publishers_hours + formData.auxiliary_hours + formData.regular_hours,
    studies: formData.publishers_studies + formData.auxiliary_studies + formData.regular_studies,
  }

  const categories = [
    { key: 'publishers', label: 'Publicadores' },
    { key: 'auxiliary', label: 'Pioneiros Auxiliares' },
    { key: 'regular', label: 'Pioneiros Regulares' },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setIsEditing(false)
        onOpenChange(val)
      }}
    >
      <DialogContent className="max-w-3xl print-area print-max-w-none">
        <DialogHeader className="no-print">
          <DialogTitle>
            Relatório Mensal - {MONTHS[summary.month.padStart(2, '0')] || summary.month} de{' '}
            {summary.year}
          </DialogTitle>
          <div className="flex justify-end pt-2 gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading}>
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="hidden print:block text-center mb-8">
            <h1 className="text-2xl font-bold">Relatório Mensal da Congregação</h1>
            <h2 className="text-lg">
              {MONTHS[summary.month.padStart(2, '0')] || summary.month} de {summary.year}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Publicadores Ativos"
              name="total_active_publishers"
              val={formData.total_active_publishers}
              isEditing={isEditing}
              onChange={handleChange}
            />
            <StatCard
              label="Média Fim de Semana"
              name="avg_attendance_weekend"
              val={formData.avg_attendance_weekend}
              isEditing={isEditing}
              onChange={handleChange}
            />
            <StatCard
              label="Média Meio de Semana"
              name="avg_attendance_midweek"
              val={formData.avg_attendance_midweek}
              isEditing={isEditing}
              onChange={handleChange}
            />
            <StatCard
              label="Metas de Assistência"
              name="attendance_goal"
              val={formData.attendance_goal}
              isEditing={isEditing}
              onChange={handleChange}
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right w-32">Relatórios</TableHead>
                  <TableHead className="text-right w-32">Horas</TableHead>
                  <TableHead className="text-right w-32">Estudos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(({ key, label }) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{label}</TableCell>
                    {['reports', 'hours', 'studies'].map((col) => (
                      <TableCell key={col} className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            name={`${key}_${col}`}
                            value={formData[`${key}_${col}`]}
                            onChange={handleChange}
                            className="h-8 text-right"
                          />
                        ) : (
                          formData[`${key}_${col}`]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/20">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totals.reports}</TableCell>
                  <TableCell className="text-right">{totals.hours}</TableCell>
                  <TableCell className="text-right">{totals.studies}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({ label, name, val, isEditing, onChange }: any) {
  return (
    <div className="border rounded-lg p-4 text-center flex flex-col justify-center min-h-[100px]">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      {isEditing ? (
        <Input
          type="number"
          min="0"
          name={name}
          value={val}
          onChange={onChange}
          className="text-center font-bold text-lg h-9"
        />
      ) : (
        <p className="text-2xl font-bold">{val}</p>
      )}
    </div>
  )
}
