import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  title: string
  value: string
  onChange: (val: string) => void
}

export function ObservationSection({ title, value, onChange }: Props) {
  return (
    <Card className="mt-4 mb-6 shadow-sm border-dashed">
      <CardHeader className="py-3 bg-muted/50">
        <CardTitle className="text-sm">{title} - Observações</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="print:hidden">
          <Textarea
            placeholder="Insira os comentários e observações para esta seção..."
            className="min-h-[100px] resize-y"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <div className="hidden print:block whitespace-pre-wrap text-sm">
          {value || 'Sem observações.'}
        </div>
      </CardContent>
    </Card>
  )
}
