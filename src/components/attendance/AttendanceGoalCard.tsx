import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Target } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  findMonthlySummary,
  createMonthlySummary,
  updateMonthlySummary,
} from '@/services/monthly_summaries'
import { getErrorMessage } from '@/lib/pocketbase/errors'

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

interface AttendanceGoalCardProps {
  globalYear: string
  summaries: any[]
  onSaved: () => void
}

export function AttendanceGoalCard({ globalYear, summaries, onSaved }: AttendanceGoalCardProps) {
  const { toast } = useToast()
  const [goalMonth, setGoalMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0'),
  )
  const [attendanceGoal, setAttendanceGoal] = useState<string>('')
  const [savingGoal, setSavingGoal] = useState(false)

  useEffect(() => {
    const summary = summaries.find((s) => s.year.toString() === globalYear && s.month === goalMonth)
    if (summary && summary.attendance_goal) {
      setAttendanceGoal(summary.attendance_goal.toString())
    } else {
      setAttendanceGoal('')
    }
  }, [goalMonth, globalYear, summaries])

  const handleSaveGoal = async () => {
    setSavingGoal(true)
    try {
      const summary = await findMonthlySummary(Number(globalYear), goalMonth)
      if (summary) {
        await updateMonthlySummary(summary.id, { attendance_goal: Number(attendanceGoal) })
      } else {
        await createMonthlySummary({
          year: Number(globalYear),
          month: goalMonth,
          attendance_goal: Number(attendanceGoal),
          total_active_publishers: 0,
          avg_attendance_midweek: 0,
          avg_attendance_weekend: 0,
          report_data: {},
        })
      }
      toast({ title: 'Meta de assistência salva com sucesso!' })
      onSaved()
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar meta',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setSavingGoal(false)
    }
  }

  return (
    <Card className="shadow-sm border-t-4 border-t-primary">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Meta de Assistência Mensal ({globalYear})
        </CardTitle>
        <CardDescription>
          Defina a meta de assistência média esperada para a congregação no mês selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="space-y-2 w-full sm:w-[150px]">
            <label className="text-sm font-medium">Mês</label>
            <Select value={goalMonth} onValueChange={setGoalMonth}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-2 w-full sm:w-[150px]">
            <label className="text-sm font-medium">Meta (Pessoas)</label>
            <Input
              type="number"
              min="0"
              value={attendanceGoal}
              onChange={(e) => setAttendanceGoal(e.target.value)}
              placeholder="Ex: 120"
            />
          </div>
          <Button onClick={handleSaveGoal} disabled={savingGoal} className="w-full sm:w-auto">
            {savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Meta'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
