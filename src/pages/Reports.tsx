import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compilação de Relatório</h2>
        <p className="text-muted-foreground">Gere e analise os relatórios consolidados mensais.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Consolidados</CardTitle>
          <CardDescription>
            Ferramentas para fechamento mensal e envio de relatórios.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border-t border-dashed m-4 rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">Módulo em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
