import { useState, useEffect, useMemo } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getMeetingAttendance, syncMeetingAttendance } from '@/services/meeting_attendance'
import {
  getMonthlySummaries,
  findMonthlySummary,
  createMonthlySummary,
  updateMonthlySummary,
} from '@/services/monthly_summaries'
import { Loader2, RefreshCw, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AttendanceChart } from '@/components/attendance/AttendanceChart'

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

export default function Attendance() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const [goalMonth, setGoalMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0'),
  )
  const [goalYear, setGoalYear] = useState<string>(new Date().getFullYear().toString())
  const [attendanceGoal, setAttendanceGoal] = useState<string>('')
  const [savingGoal, setSavingGoal] = useState(false)

  const isSecretary = user?.role === 'Secretário'

  const loadData = async () => {
    try {
      const records = await getMeetingAttendance()
      // Filter for records from September 2025 onwards as per requirements
      const cutoffDate = new Date('2025-09-01T00:00:00Z')
      const filtered = records.filter((r) => new Date(r.meeting_date) >= cutoffDate)
      setData(filtered)

      const sums = await getMonthlySummaries()
      setSummaries(sums)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const summary = summaries.find((s) => s.year.toString() === goalYear && s.month === goalMonth)
    if (summary && summary.attendance_goal) {
      setAttendanceGoal(summary.attendance_goal.toString())
    } else {
      setAttendanceGoal('')
    }
  }, [goalMonth, goalYear, summaries])

  useRealtime('meeting_attendance', () => {
    loadData()
  })
  useRealtime('monthly_summaries', () => {
    loadData()
  })

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncMeetingAttendance()
      toast({
        title: 'Sincronização concluída!',
        description: `${res.imported} reuniões importadas.`,
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: 'Erro na sincronização',
        description: error?.message || 'Falha ao importar dados.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleSaveGoal = async () => {
    setSavingGoal(true)
    try {
      const summary = await findMonthlySummary(Number(goalYear), goalMonth)
      if (summary) {
        await updateMonthlySummary(summary.id, { attendance_goal: Number(attendanceGoal) })
      } else {
        await createMonthlySummary({
          year: Number(goalYear),
          month: goalMonth,
          attendance_goal: Number(attendanceGoal),
          total_active_publishers: 0,
          avg_attendance_midweek: 0,
          avg_attendance_weekend: 0,
          report_data: {},
        })
      }
      toast({ title: 'Meta de assistência salva com sucesso!' })
      await loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao salvar meta', description: e.message, variant: 'destructive' })
    } finally {
      setSavingGoal(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const availableYears = useMemo(() => {
    const years = new Set(data.map((d) => new Date(d.meeting_date).getFullYear().toString()))
    years.add(new Date().getFullYear().toString())
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [data])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assistência às Reuniões</h2>
          <p className="text-muted-foreground">Controle de presença e assistência das reuniões.</p>
        </div>
        {isSecretary && (
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar com Google Sheets
          </Button>
        )}
      </div>

      {isSecretary && (
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Meta de Assistência Mensal
            </CardTitle>
            <CardDescription>
              Defina a meta de assistência média esperada para a congregação.
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
              <div className="space-y-2 w-full sm:w-[120px]">
                <label className="text-sm font-medium">Ano</label>
                <Select value={goalYear} onValueChange={setGoalYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
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
      )}

      <AttendanceChart data={data} summaries={summaries} loading={loading} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Registros Recentes</CardTitle>
          <CardDescription>
            Lista de assistência das reuniões a partir de Setembro de 2025.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/10 mt-2">
              <p className="text-muted-foreground text-sm font-medium">
                Nenhuma reunião encontrada para o período.
              </p>
            </div>
          ) : (
            <div className="rounded-md border mt-2 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Reunião</TableHead>
                    <TableHead className="text-right font-semibold">Presenciais</TableHead>
                    <TableHead className="text-right font-semibold">Zoom</TableHead>
                    <TableHead className="text-right font-bold text-primary">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => {
                    const total = record.in_person + record.zoom
                    const label =
                      record.meeting_type === 'domingo'
                        ? 'Reunião de Fim de Semana'
                        : 'Reunião Vida e Ministério'
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {formatDate(record.meeting_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={record.meeting_type === 'domingo' ? 'default' : 'secondary'}
                            className="font-medium"
                          >
                            {label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {record.in_person}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {record.zoom}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{total}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
