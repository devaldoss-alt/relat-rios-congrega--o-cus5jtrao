import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HealthMetrics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Métricas de Saúde</h2>
        <p className="text-muted-foreground">
          Acompanhe os indicadores de saúde e crescimento da congregação.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores Gerais</CardTitle>
          <CardDescription>Gráficos e estatísticas de participação e atividades.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border-t border-dashed m-4 rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">Módulo em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
