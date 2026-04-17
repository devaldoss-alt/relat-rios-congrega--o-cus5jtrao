import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GroupData() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Entrada de Dados de Grupo</h2>
        <p className="text-muted-foreground">
          Gerencie e registre as informações dos grupos da congregação.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Painel de Grupos</CardTitle>
          <CardDescription>
            Selecione um grupo para adicionar novos relatórios de atividade.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border-t border-dashed m-4 rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">Módulo em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
