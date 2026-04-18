import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AttendanceChart } from '@/components/attendance/AttendanceChart'

export default function Attendance() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const isSecretary = user?.role === 'Secretário'

  const loadData = async () => {
    try {
      const records = await getMeetingAttendance()
      setData(records)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('meeting_attendance', () => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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

      <AttendanceChart data={data} loading={loading} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Registros Recentes</CardTitle>
          <CardDescription>
            Lista de assistência das últimas reuniões sincronizadas.
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
                Nenhuma reunião sincronizada
              </p>
            </div>
          ) : (
            <div className="rounded-md border mt-2 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="text-right font-semibold">Presenciais</TableHead>
                    <TableHead className="text-right font-semibold">Zoom</TableHead>
                    <TableHead className="text-right font-bold text-primary">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record) => {
                    const total = record.in_person + record.zoom
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {formatDate(record.meeting_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={record.meeting_type === 'domingo' ? 'default' : 'secondary'}
                            className="capitalize font-medium"
                          >
                            {record.meeting_type}
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
