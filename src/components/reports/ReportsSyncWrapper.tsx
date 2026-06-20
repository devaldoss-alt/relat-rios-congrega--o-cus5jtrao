import { useState, useEffect, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { forceSyncMonthlySummary, MonthlySummary } from '@/services/monthly_summaries'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

export function ReportsSyncWrapper({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState<number | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const [reloadFn, setReloadFn] = useState<(() => void) | null>(null)
  const [summary, setSummary] = useState<MonthlySummary | null>(null)

  const [isOutOfSync, setIsOutOfSync] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const onDateChange = (e: any) => {
      setMonth(e.detail.month)
      setYear(e.detail.year)
      setReloadFn(() => e.detail.reload)
    }
    const onSummaryLoaded = (e: any) => {
      setSummary(e.detail.summary)
    }

    window.addEventListener('reports-date-change', onDateChange)
    window.addEventListener('reports-summary-loaded', onSummaryLoaded)

    return () => {
      window.removeEventListener('reports-date-change', onDateChange)
      window.removeEventListener('reports-summary-loaded', onSummaryLoaded)
    }
  }, [])

  const checkSyncStatus = async () => {
    if (!month || !year || !summary) return

    try {
      const mStr = month.toString().padStart(2, '0')

      const latestPubReport = await pb
        .collection('publisher_reports')
        .getList(1, 1, {
          filter: `month = '${mStr}' && year = ${year}`,
          sort: '-updated',
          fields: 'updated',
        })
        .catch(() => ({ items: [] }))

      const latestAttendance = await pb
        .collection('meeting_attendance')
        .getList(1, 1, {
          filter: `meeting_date >= '${year}-${mStr}-01 00:00:00' && meeting_date <= '${year}-${mStr}-31 23:59:59'`,
          sort: '-updated',
          fields: 'updated',
        })
        .catch(() => ({ items: [] }))

      const latestPublisher = await pb
        .collection('publishers')
        .getList(1, 1, {
          sort: '-updated',
          fields: 'updated',
        })
        .catch(() => ({ items: [] }))

      const dates = [
        summary.updated ? new Date(summary.updated).getTime() : 0,
        latestPubReport.items[0]?.updated
          ? new Date(latestPubReport.items[0].updated).getTime()
          : 0,
        latestAttendance.items[0]?.updated
          ? new Date(latestAttendance.items[0].updated).getTime()
          : 0,
        latestPublisher.items[0]?.updated
          ? new Date(latestPublisher.items[0].updated).getTime()
          : 0,
      ]

      const summaryTime = dates[0]
      const maxDataTime = Math.max(dates[1], dates[2], dates[3])

      setIsOutOfSync(maxDataTime > summaryTime)
    } catch (e) {
      console.error('Error checking sync status', e)
    }
  }

  useEffect(() => {
    checkSyncStatus()
  }, [month, year, summary])

  useRealtime('publisher_reports', (e) => {
    if (!month || !year) return
    const mStr = month.toString().padStart(2, '0')
    if (e.record.month === mStr && e.record.year === year) {
      setIsOutOfSync(true)
    }
  })

  useRealtime('publishers', () => {
    setIsOutOfSync(true)
  })

  useRealtime('meeting_attendance', (e) => {
    if (!month || !year) return
    const mStr = month.toString().padStart(2, '0')
    if (e.record.meeting_date.startsWith(`${year}-${mStr}`)) {
      setIsOutOfSync(true)
    }
  })

  const handleSync = async () => {
    if (!month || !year) return
    try {
      setIsSyncing(true)
      await forceSyncMonthlySummary(month, year)
      setIsOutOfSync(false)
      toast.success('Totais do mês sincronizados com sucesso!')
      if (reloadFn) reloadFn()
    } catch (e) {
      toast.error('Erro ao sincronizar resumo.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      {month && year && (
        <div className="sticky top-0 z-10 w-full mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card
            className={cn(
              'flex flex-row items-center justify-between p-4 shadow-sm border transition-colors duration-300',
              isOutOfSync
                ? 'border-yellow-500/50 bg-yellow-500/5'
                : 'border-green-500/50 bg-green-500/5',
            )}
          >
            <div className="flex items-center gap-3">
              {isOutOfSync ? (
                <>
                  <div className="rounded-full bg-yellow-100 p-1.5 dark:bg-yellow-900/30">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                      Totais Desatualizados
                    </span>
                    <span className="text-xs text-yellow-700/80 dark:text-yellow-500/80">
                      Novos dados foram inseridos após o último cálculo.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-green-800 dark:text-green-400">
                      Totais Sincronizados
                    </span>
                    <span className="text-xs text-green-700/80 dark:text-green-500/80">
                      {summary?.updated
                        ? `Atualizado em ${new Date(summary.updated).toLocaleString('pt-BR')}`
                        : 'Dados atualizados'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleSync}
              disabled={isSyncing || !isOutOfSync}
              variant={isOutOfSync ? 'default' : 'outline'}
              className={cn(
                'min-w-[140px]',
                isOutOfSync &&
                  'bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700',
              )}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Calculando...' : 'Sincronizar'}
            </Button>
          </Card>
        </div>
      )}

      <div className="flex-1">{children}</div>
    </div>
  )
}
