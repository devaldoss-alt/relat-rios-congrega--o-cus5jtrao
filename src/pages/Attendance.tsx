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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getMeetingAttendance, syncMeetingAttendance } from '@/services/meeting_attendance'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getMonthlySummaries,
  findMonthlySummary,
  createMonthlySummary,
  updateMonthlySummary,
} from '@/services/monthly_summaries'
import { Loader2, RefreshCw, Target, Calendar } from 'lucide-react'
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
  const [syncReport, setSyncReport] = useState<{ imported: number; ignored: number; errors: string[] } | null>(null)

  const currentYear = new Date().getFullYear().toString()
  const [globalYear, setGlobalYear] = useState<string>(currentYear)

  const [goalMonth, setGoalMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0'),
  )
  const [attendanceGoal, setAttendanceGoal] = useState<string>('')
  const [savingGoal, setSavingGoal] = useState(false)

  const isSecretary = user?.role === 'Secretário'

  const loadData = async () => {
    try {
      const records = await getMeetingAttendance()
      setData(records)

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
    const summary = summaries.find((s) => s.year.toString() === globalYear && s.month === goalMonth)
    if (summary && summary.attendance_goal) {
      setAttendanceGoal(summary.attendance_goal.toString())
    } else {
      setAttendanceGoal('')
    }
  }, [goalMonth, globalYear, summaries])

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
      const ignoredCount =
        res.ignored !== undefined ? res.ignored : res.errors ? res.errors.length : 0

      setSyncReport({
        imported: res.imported,
        ignored: ignoredCount,
        errors: res.errors || [],
      })

      toast({
        title: 'Sincronização concluída!',
        description: `${res.imported} reuniões importadas. ${ignoredCount} linhas ignoradas.`,
      })
      await loadData()
    } catch (error: unknown) {
      toast({
        title: 'Erro na sincronização',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

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
      await loadData()
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar meta', description: getErrorMessage(e), variant: 'destructive' })
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
      timeZone: 'UTC',
    }).format(date)
  }

  const availableYears = useMemo(() => {
    const years = new Set(data.map((d) => new Date(d.meeting_date).getFullYear().toString()))
    years.add(new Date().getFullYear().toString())
    years.add('2025')
    years.add('2026')
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [data])

  const filteredData = useMemo(() => {
    return data.filter((d) => new Date(d.meeting_date).getFullYear().toString() === globalYear)
  }, [data, globalYear])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assistência às Reuniões</h2>
          <p className="text-muted-foreground">Controle de presença e assistência das reuniões.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-background border rounded-md px-3 py-1 shadow-sm">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <Select value={globalYear} onValueChange={setGlobalYear}>
              <SelectTrigger className="w-[100px] border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Ano" />
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
              Sincronizar
            </Button>
          )}
        </div>
      </div>

      {isSecretary && (
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
      )}

      <AttendanceChart
        data={data}
        summaries={summaries}
        loading={loading}
        selectedYear={globalYear}
      />

      <Dialog open={!!syncReport} onOpenChange={(open) => !open && setSyncReport(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Relatório de Sincronização</DialogTitle>
            <DialogDescription>Resumo da importação da planilha de assistência.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 text-green-700 p-3 rounded-md">
                <p className="text-sm font-medium">Importados/Atualizados</p>
                <p className="text-2xl font-bold">{syncReport?.imported || 0}</p>
              </div>
              <div className="bg-amber-50 text-amber-700 p-3 rounded-md">
                <p className="text-sm font-medium">Linhas Ignoradas</p>
                <p className="text-2xl font-bold">{syncReport?.ignored || 0}</p>
              </div>
            </div>

            {syncReport?.errors && syncReport.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Erros e Alertas Encontrados</h4>
                <div className="bg-muted p-3 rounded-md text-sm space-y-2 max-h-[300px] overflow-y-auto">
                  {syncReport.errors.map((err, i) => (
                    <p key={i} className="text-red-600">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Histórico de Reuniões ({globalYear})</CardTitle>
          <CardDescription>Lista de assistência das reuniões no ano selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/10 mt-2">
              <p className="text-muted-foreground text-sm font-medium">
                Nenhuma reunião encontrada para {globalYear}.
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
                  {filteredData.map((record) => {
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
