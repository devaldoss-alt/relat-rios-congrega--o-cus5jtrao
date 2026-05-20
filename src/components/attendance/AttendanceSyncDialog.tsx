import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SyncReport {
  imported: number
  ignored: number
  errors: string[]
}

interface AttendanceSyncDialogProps {
  report: SyncReport | null
  onClose: () => void
}

export function AttendanceSyncDialog({ report, onClose }: AttendanceSyncDialogProps) {
  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório de Sincronização</DialogTitle>
          <DialogDescription>Resumo da importação da planilha de assistência.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 text-green-700 p-3 rounded-md">
              <p className="text-sm font-medium">Importados/Atualizados</p>
              <p className="text-2xl font-bold">{report?.imported || 0}</p>
            </div>
            <div className="bg-amber-50 text-amber-700 p-3 rounded-md">
              <p className="text-sm font-medium">Linhas Ignoradas</p>
              <p className="text-2xl font-bold">{report?.ignored || 0}</p>
            </div>
          </div>

          {report?.errors && report.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Erros e Alertas Encontrados</h4>
              <div className="bg-muted p-3 rounded-md text-sm space-y-2 max-h-[300px] overflow-y-auto">
                {report.errors.map((err, i) => (
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
  )
}
