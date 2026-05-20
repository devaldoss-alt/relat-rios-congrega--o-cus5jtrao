import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getMeetingAttendance, syncMeetingAttendance } from '@/services/meeting_attendance'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getMonthlySummaries } from '@/services/monthly_summaries'
import { Loader2, RefreshCw, Calendar } from 'lucide-react'
import { AttendanceChart } from '@/components/attendance/AttendanceChart'
import { AttendanceTable } from '@/components/attendance/AttendanceTable'
import { AttendanceGoalCard } from '@/components/attendance/AttendanceGoalCard'
import { AttendanceSyncDialog } from '@/components/attendance/AttendanceSyncDialog'

export default function Attendance() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncReport, setSyncReport] = useState<{
    imported: number
    ignored: number
    errors: string[]
  } | null>(null)

  const currentYear = new Date().getFullYear().toString()
  const [globalYear, setGlobalYear] = useState<string>(currentYear)

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

  useRealtime('meeting_attendance', loadData)
  useRealtime('monthly_summaries', loadData)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncMeetingAttendance()
      const ignoredCount =
        res.ignored !== undefined ? res.ignored : res.errors ? res.errors.length : 0
      setSyncReport({ imported: res.imported, ignored: ignoredCount, errors: res.errors || [] })
      toast({
        title: 'Sincronização concluída!',
        description: `${res.imported} reuniões importadas.`,
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
        <AttendanceGoalCard globalYear={globalYear} summaries={summaries} onSaved={loadData} />
      )}

      <AttendanceChart
        data={data}
        summaries={summaries}
        loading={loading}
        selectedYear={globalYear}
      />

      <AttendanceSyncDialog report={syncReport} onClose={() => setSyncReport(null)} />

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
            <AttendanceTable data={filteredData} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
