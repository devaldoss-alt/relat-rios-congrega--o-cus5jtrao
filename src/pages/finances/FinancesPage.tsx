import { useEffect, useState } from 'react'
import { getFinances, createFinance, deleteFinance } from '@/services/finances'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function FinancesPage() {
  const [finances, setFinances] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    transaction_date: '',
    type: 'Entrada',
    category: '',
    amount: '',
    description: '',
  })

  const loadData = async () => setFinances(await getFinances())

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('finances', loadData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createFinance({
        ...formData,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        amount: parseFloat(formData.amount.replace(',', '.')),
      })
      toast.success('Transação registrada')
      setIsOpen(false)
      setFormData({
        transaction_date: '',
        type: 'Entrada',
        category: '',
        amount: '',
        description: '',
      })
    } catch (err: any) {
      toast.error('Erro ao registrar transação')
    }
  }

  const balance = finances.reduce(
    (acc, f) => acc + (f.type === 'Entrada' ? f.amount : -f.amount),
    0,
  )

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p
            className={cn(
              'text-lg font-semibold mt-1',
              balance >= 0 ? 'text-emerald-600' : 'text-destructive',
            )}
          >
            Saldo: {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada</SelectItem>
                      <SelectItem value="Saída">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    placeholder="Ex: Dízimo, Luz"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Salvar Transação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.map((fin) => (
                <TableRow key={fin.id}>
                  <TableCell>
                    {new Date(fin.transaction_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={fin.type === 'Entrada' ? 'default' : 'secondary'}
                      className={
                        fin.type === 'Entrada'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : ''
                      }
                    >
                      {fin.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fin.description}</TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex items-center justify-end gap-1">
                      {fin.type === 'Entrada' ? (
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={fin.type === 'Entrada' ? 'text-emerald-600' : 'text-destructive'}
                      >
                        {fin.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteFinance(fin.id).catch(() => toast.error('Erro ao excluir'))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {finances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
