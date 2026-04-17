import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Attendance() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Assistência às Reuniões</h2>
        <p className="text-muted-foreground">Controle de presença e assistência dos membros.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros Recentes</CardTitle>
          <CardDescription>Visualize a lista de assistência das últimas reuniões.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border-t border-dashed m-4 rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">Módulo em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
