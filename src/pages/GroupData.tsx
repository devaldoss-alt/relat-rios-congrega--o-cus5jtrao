import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { getGroups } from '@/services/groups'
import { getGroupReport, createGroupReport, updateGroupReport } from '@/services/group_reports'
import { useRealtime } from '@/hooks/use-realtime'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, AlertCircle, Loader2 } from 'lucide-react'

const numberField = z
  .union([z.string(), z.number()])
  .transform((v) => (v === '' ? 0 : Number(v)))
  .pipe(z.number().min(0, 'Mínimo 0'))

const formSchema = z.object({
  publishers_count: numberField,
  publisher_hours: numberField,
  publisher_bible_studies: numberField,
  auxiliary_pioneers_count: numberField,
  auxiliary_pioneer_hours: numberField,
  auxiliary_pioneer_bible_studies: numberField,
  regular_pioneers_count: numberField,
  regular_pioneer_hours: numberField,
  regular_pioneer_bible_studies: numberField,
})

const months = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

const years = ['2024', '2025', '2026']

const CategorySection = ({
  title,
  prefix,
  control,
}: {
  title: string
  prefix: 'publisher' | 'auxiliary_pioneer' | 'regular_pioneer'
  control: any
}) => {
  const countName =
    prefix === 'publisher'
      ? 'publishers_count'
      : prefix === 'auxiliary_pioneer'
        ? 'auxiliary_pioneers_count'
        : 'regular_pioneers_count'
  const hoursName = `${prefix}_hours`
  const studiesName = `${prefix}_bible_studies`

  return (
    <div className="space-y-4 p-5 border rounded-xl bg-card/50 shadow-sm">
      <h3 className="font-semibold text-lg border-b pb-2 text-primary">{title}</h3>

      <FormField
        control={control}
        name={countName as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ativos (Pessoas)</FormLabel>
            <FormControl>
              <Input type="number" min="0" {...field} className="bg-background" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={hoursName as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total de Horas</FormLabel>
            <FormControl>
              <Input type="number" min="0" step="0.1" {...field} className="bg-background" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={studiesName as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estudos Bíblicos</FormLabel>
            <FormControl>
              <Input type="number" min="0" {...field} className="bg-background" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export default function GroupData() {
  const { user } = useAuth()
  const { toast } = useToast()

  const isSecretario = user?.role === 'Secretário'
  const isResponsavel = user?.role === 'Responsável'

  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupNumber, setSelectedGroupNumber] = useState<string>(
    user?.group_number?.toString() || '1',
  )

  const currentMonth = new Date().getMonth() + 1
  const [selectedMonth, setSelectedMonth] = useState<string>(
    currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`,
  )
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const [reportId, setReportId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publishers_count: 0,
      publisher_hours: 0,
      publisher_bible_studies: 0,
      auxiliary_pioneers_count: 0,
      auxiliary_pioneer_hours: 0,
      auxiliary_pioneer_bible_studies: 0,
      regular_pioneers_count: 0,
      regular_pioneer_hours: 0,
      regular_pioneer_bible_studies: 0,
    },
  })

  useEffect(() => {
    getGroups().then(setGroups).catch(console.error)
  }, [])

  const selectedGroup = groups.find((g) => g.number.toString() === selectedGroupNumber)
  const selectedGroupId = selectedGroup?.id

  const loadReport = useCallback(async () => {
    if (!selectedGroupId) return
    setIsLoading(true)
    try {
      const monthStr = `${selectedYear}-${selectedMonth}`
      const report = await getGroupReport(selectedGroupId, monthStr)
      if (report) {
        setReportId(report.id)
        form.reset({
          publishers_count: report.publishers_count || 0,
          publisher_hours: report.publisher_hours || 0,
          publisher_bible_studies: report.publisher_bible_studies || 0,
          auxiliary_pioneers_count: report.auxiliary_pioneers_count || 0,
          auxiliary_pioneer_hours: report.auxiliary_pioneer_hours || 0,
          auxiliary_pioneer_bible_studies: report.auxiliary_pioneer_bible_studies || 0,
          regular_pioneers_count: report.regular_pioneers_count || 0,
          regular_pioneer_hours: report.regular_pioneer_hours || 0,
          regular_pioneer_bible_studies: report.regular_pioneer_bible_studies || 0,
        })
      } else {
        setReportId(null)
        form.reset({
          publishers_count: 0,
          publisher_hours: 0,
          publisher_bible_studies: 0,
          auxiliary_pioneers_count: 0,
          auxiliary_pioneer_hours: 0,
          auxiliary_pioneer_bible_studies: 0,
          regular_pioneers_count: 0,
          regular_pioneer_hours: 0,
          regular_pioneer_bible_studies: 0,
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Ocorreu um erro ao buscar o relatório.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedGroupId, selectedMonth, selectedYear, form.reset, toast])

  useEffect(() => {
    if (selectedGroupId) {
      loadReport()
    } else if (groups.length > 0) {
      setIsLoading(false)
    }
  }, [loadReport, selectedGroupId, groups.length])

  useRealtime('group_reports', (e) => {
    if (e.action === 'create' || e.action === 'update') {
      if (
        e.record.group_id === selectedGroupId &&
        e.record.month === `${selectedYear}-${selectedMonth}`
      ) {
        loadReport()
      }
    }
  })

  if (!isSecretario && !isResponsavel) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedGroupId) {
      toast({
        title: 'Erro de Grupo',
        description: 'Grupo não encontrado. Verifique suas permissões.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const monthStr = `${selectedYear}-${selectedMonth}`
      const data = {
        group_id: selectedGroupId,
        month: monthStr,
        ...values,
      }

      if (reportId) {
        await updateGroupReport(reportId, data)
      } else {
        const created = await createGroupReport(data)
        setReportId(created.id)
      }

      toast({
        title: 'Relatório salvo com sucesso!',
        className: 'bg-green-600 text-white border-none',
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao salvar',
        description: err?.response?.message || 'Ocorreu um erro inesperado ao salvar os dados.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Entrada de Dados</h2>
        <p className="text-muted-foreground mt-1">
          Insira e atualize os relatórios mensais de atividade do seu grupo.
        </p>
      </div>

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader className="bg-muted/30 pb-6 border-b">
          <CardTitle>Período e Grupo</CardTitle>
          <CardDescription>
            Selecione o mês, ano e grupo para visualizar ou preencher os dados.
          </CardDescription>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Grupo</label>
              {isSecretario ? (
                <Select value={selectedGroupNumber} onValueChange={setSelectedGroupNumber}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o Grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Grupo {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={`Grupo ${selectedGroupNumber}`} disabled className="bg-muted" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4 p-5 border rounded-xl bg-card/50">
                  <Skeleton className="h-7 w-32 mb-4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!reportId && (
                  <div className="flex items-center gap-3 text-amber-800 bg-amber-100/50 p-4 rounded-lg border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-medium">
                      Nenhum relatório preenchido para este mês. Você pode criar um novo abaixo.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <CategorySection title="Publicadores" prefix="publisher" control={form.control} />
                  <CategorySection
                    title="Pioneiros Auxiliares"
                    prefix="auxiliary_pioneer"
                    control={form.control}
                  />
                  <CategorySection
                    title="Pioneiros Regulares"
                    prefix="regular_pioneer"
                    control={form.control}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t mt-8">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSaving || !selectedGroupId}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Relatório
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
