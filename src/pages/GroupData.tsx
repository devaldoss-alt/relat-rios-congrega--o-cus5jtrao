import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { getGroups, updateGroup } from '@/services/groups'
import { getGroupReport, createGroupReport, updateGroupReport } from '@/services/group_reports'
import { getPublishersByGroup } from '@/services/publishers'
import {
  getPublisherReports,
  savePublisherReport,
  calculateActivityStatus,
} from '@/services/publisher_reports'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Link } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Save, AlertCircle, Loader2, Target } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const numberField = z
  .union([z.string(), z.number()])
  .transform((v) => (v === '' ? 0 : Number(v)))
  .pipe(z.number().min(0, 'Mínimo 0'))

const reportSchema = z.object({
  id: z.string().optional(),
  publisher_id: z.string(),
  name: z.string(),
  type: z.string(),
  active: z.boolean(),
  activity_status: z.string().optional(),
  participated: z.boolean().default(false),
  hours: numberField,
  bible_studies: numberField,
  notes: z.string().optional(),
})

const formSchema = z.object({
  reports: z.array(reportSchema),
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

const years = ['2024', '2025', '2026', '2027']

export default function GroupData() {
  const { user } = useAuth()
  const { toast } = useToast()

  const isSecretario = user?.role === 'Secretário'
  const isResponsavel = user?.role === 'Responsável'

  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupNumber, setSelectedGroupNumber] = useState<string>(
    (user?.group_number || 1).toString(),
  )

  const currentMonth = new Date().getMonth() + 1
  const [selectedMonth, setSelectedMonth] = useState<string>(
    currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`,
  )
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const [groupReportId, setGroupReportId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  const [missingPrevious, setMissingPrevious] = useState(false)

  const [hourGoal, setHourGoal] = useState<string>('')
  const [pioneerHourGoal, setPioneerHourGoal] = useState<string>('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reports: [],
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: 'reports',
  })

  useEffect(() => {
    getGroups().then(setGroups).catch(console.error)
  }, [])

  const selectedGroup = groups.find((g) => g.number.toString() === selectedGroupNumber)
  const selectedGroupId = selectedGroup?.id

  useEffect(() => {
    if (selectedGroup) {
      setHourGoal(selectedGroup.hour_goal?.toString() || '')
      setPioneerHourGoal(selectedGroup.regular_pioneer_hour_goal?.toString() || '')
    }
  }, [selectedGroup])

  const loadReport = useCallback(async () => {
    if (!selectedGroupId) return
    setIsLoading(true)
    try {
      const monthStr = `${selectedYear}-${selectedMonth}`
      const gReport = await getGroupReport(selectedGroupId, monthStr)
      setGroupReportId(gReport?.id || null)

      let pM = Number(selectedMonth) - 1
      let pY = Number(selectedYear)
      if (pM === 0) {
        pM = 12
        pY -= 1
      }
      const prevMonthStr = `${pY}-${pM.toString().padStart(2, '0')}`
      try {
        const prevGReport = await getGroupReport(selectedGroupId, prevMonthStr)
        setMissingPrevious(!prevGReport)
      } catch {
        setMissingPrevious(true)
      }

      const pubs = await getPublishersByGroup(selectedGroupId)
      const allPReports = await pb.collection('publisher_reports').getFullList({
        filter: `publisher_id.group_id = '${selectedGroupId}' && (year = ${selectedYear} || year = ${Number(selectedYear) - 1})`,
      })
      const pReports = allPReports.filter(
        (r) => r.month === selectedMonth && r.year === Number(selectedYear),
      )

      const mergedReports = pubs
        .filter((pub) => pub.active || pReports.some((r) => r.publisher_id === pub.id))
        .map((pub) => {
          const existing = pReports.find((r) => r.publisher_id === pub.id)

          const status = calculateActivityStatus(
            pub.id,
            allPReports as any,
            Number(selectedMonth),
            Number(selectedYear),
          )

          return {
            id: existing?.id,
            publisher_id: pub.id,
            name: pub.name,
            type: existing?.type || pub.type || 'publicador',
            active: pub.active,
            activity_status: status,
            participated: existing?.participated || false,
            hours: existing?.hours || 0,
            bible_studies: existing?.bible_studies || 0,
            notes: existing?.notes || '',
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))

      form.reset({ reports: mergedReports })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Ocorreu um erro ao buscar os relatórios.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedGroupId, selectedMonth, selectedYear, form, toast])

  useEffect(() => {
    if (selectedGroupId) {
      loadReport()
    } else if (groups.length > 0) {
      setIsLoading(false)
    }
  }, [loadReport, selectedGroupId, groups.length])

  useRealtime('publishers', () => {
    if (selectedGroupId) {
      loadReport()
    }
  })

  if (!isSecretario && !isResponsavel) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSaveGoal = async () => {
    if (!selectedGroupId || !isSecretario) return
    setIsSavingGoal(true)
    try {
      await updateGroup(selectedGroupId, {
        hour_goal: Number(hourGoal),
        regular_pioneer_hour_goal: Number(pioneerHourGoal),
      })
      toast({ title: 'Metas do grupo atualizadas com sucesso!' })
      const updatedGroups = await getGroups()
      setGroups(updatedGroups)
    } catch (e) {
      toast({ title: 'Erro ao atualizar metas', variant: 'destructive' })
    } finally {
      setIsSavingGoal(false)
    }
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
      await Promise.all(
        values.reports.map((report) =>
          savePublisherReport({
            id: report.id,
            publisher_id: report.publisher_id,
            month: selectedMonth,
            year: Number(selectedYear),
            participated: report.participated,
            hours: report.hours,
            bible_studies: report.bible_studies,
            notes: report.notes,
            type: report.type,
          }),
        ),
      )

      let publishers_count = 0
      let publisher_hours = 0
      let publisher_bible_studies = 0

      let auxiliary_pioneers_count = 0
      let auxiliary_pioneer_hours = 0
      let auxiliary_pioneer_bible_studies = 0

      let regular_pioneers_count = 0
      let regular_pioneer_hours = 0
      let regular_pioneer_bible_studies = 0

      const prevReports = await pb.collection('publisher_reports').getFullList({
        filter: `publisher_id.group_id = '${selectedGroupId}' && (year = ${selectedYear} || year = ${Number(selectedYear) - 1})`,
      })

      const allReports = prevReports.filter(
        (r) => !(r.month === selectedMonth && r.year === Number(selectedYear)),
      )

      for (const r of values.reports) {
        allReports.push({
          publisher_id: r.publisher_id,
          month: selectedMonth,
          year: Number(selectedYear),
          participated: r.participated || r.hours > 0 || r.bible_studies > 0,
          hours: r.hours,
          bible_studies: r.bible_studies,
          type: r.type,
        } as any)
      }

      for (const report of values.reports) {
        const status = calculateActivityStatus(
          report.publisher_id,
          allReports as any,
          Number(selectedMonth),
          Number(selectedYear),
        )
        const isCounted = status === 'Ativo' || status === 'Não Participou'

        if (report.type === 'publicador') {
          if (isCounted) publishers_count++
          publisher_hours += report.hours
          publisher_bible_studies += report.bible_studies
        } else if (report.type === 'pioneiro_auxiliar') {
          if (isCounted) auxiliary_pioneers_count++
          auxiliary_pioneer_hours += report.hours
          auxiliary_pioneer_bible_studies += report.bible_studies
        } else if (report.type === 'pioneiro_regular') {
          if (isCounted) regular_pioneers_count++
          regular_pioneer_hours += report.hours
          regular_pioneer_bible_studies += report.bible_studies
        }
      }

      const monthStr = `${selectedYear}-${selectedMonth}`
      const groupData = {
        group_id: selectedGroupId,
        month: monthStr,
        publishers_count,
        publisher_hours,
        publisher_bible_studies,
        auxiliary_pioneers_count,
        auxiliary_pioneer_hours,
        auxiliary_pioneer_bible_studies,
        regular_pioneers_count,
        regular_pioneer_hours,
        regular_pioneer_bible_studies,
      }

      if (groupReportId) {
        await updateGroupReport(groupReportId, groupData)
      } else {
        const created = await createGroupReport(groupData)
        setGroupReportId(created.id)
      }

      toast({
        title: 'Relatórios salvos com sucesso!',
        className: 'bg-green-600 text-white border-none',
      })

      await loadReport()
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Entrada de Dados do Grupo</h2>
          <p className="text-muted-foreground mt-1">
            Registre a atividade mensal de cada publicador do seu grupo individualmente.
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="shrink-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
        >
          <Link to="/tutorial" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Como preencher?
          </Link>
        </Button>
      </div>

      {missingPrevious && !isLoading && (
        <Alert
          variant="destructive"
          className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-4"
        >
          <AlertCircle className="h-4 w-4" color="currentColor" />
          <AlertDescription className="text-sm">
            <strong className="block mb-1 text-base">Atenção</strong>O relatório do{' '}
            <strong>mês anterior</strong> ainda não foi salvo ou está pendente para o grupo
            selecionado. Recomendamos regularizar os meses passados para garantir a precisão dos
            registros.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader className="bg-muted/30 pb-6 border-b">
          <CardTitle>Período e Grupo</CardTitle>
          <CardDescription>
            Selecione o mês, ano e grupo para visualizar ou preencher os dados dos publicadores.
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
                    {[...groups]
                      .sort((a, b) => a.number - b.number)
                      .map((g) => (
                        <SelectItem key={g.id} value={g.number.toString()}>
                          Grupo {g.number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={`Grupo ${selectedGroupNumber}`} disabled className="bg-muted" />
              )}
            </div>
          </div>

          {isSecretario && (
            <div className="mt-6 pt-6 border-t flex flex-col md:flex-row items-end gap-4">
              <div className="space-y-2 flex-1 max-w-[200px]">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Meta Grupo (Horas)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ex: 100"
                  value={hourGoal}
                  onChange={(e) => setHourGoal(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2 flex-1 max-w-[250px]">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Meta Pioneiros Regulares
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Horas/publicador"
                  value={pioneerHourGoal}
                  onChange={(e) => setPioneerHourGoal(e.target.value)}
                  className="bg-background"
                />
              </div>
              <Button
                onClick={handleSaveGoal}
                disabled={isSavingGoal || !selectedGroupId}
                className="w-full md:w-auto"
              >
                {isSavingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Metas'}
              </Button>
            </div>
          )}

          {selectedGroupId && hourGoal && Number(hourGoal) > 0 && (
            <div className="mt-6 pt-6 border-t flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Progresso da Meta Geral ({selectedMonth}/{selectedYear})
                </span>
                <span className="text-sm font-bold text-primary">
                  {fields.reduce((acc, f) => acc + Number(f.hours || 0), 0)} / {hourGoal}h
                </span>
              </div>
              <Progress
                value={Math.min(
                  (fields.reduce((acc, f) => acc + Number(f.hours || 0), 0) / Number(hourGoal)) *
                    100,
                  100,
                )}
                className="h-3"
              />
            </div>
          )}
        </CardHeader>
      </Card>

      <Card className="border-t-4 border-t-primary shadow-md mt-8">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle>Relatório Individual</CardTitle>
          <CardDescription>
            Preencha os dados de atividade de cada publicador na tabela abaixo. O relatório total do
            grupo será calculado e salvo automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {!groupReportId && fields.length > 0 && (
                  <div className="flex items-center gap-3 text-amber-800 bg-amber-100/50 p-4 m-6 rounded-lg border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-medium">
                      Nenhum relatório preenchido para este mês. Preencha a tabela abaixo para
                      salvar a atividade.
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="w-[25%]">Nome do Publicador</TableHead>
                        <TableHead className="w-[15%]">
                          Tipo{' '}
                          <span className="text-red-500" title="Obrigatório">
                            *
                          </span>
                        </TableHead>
                        <TableHead className="w-[10%] text-center">Participou?</TableHead>
                        <TableHead className="w-[15%]">
                          Horas{' '}
                          <span className="text-red-500" title="Obrigatório">
                            *
                          </span>
                        </TableHead>
                        <TableHead className="w-[10%]">
                          Estudos{' '}
                          <span className="text-red-500" title="Obrigatório">
                            *
                          </span>
                        </TableHead>
                        <TableHead className="w-[25%]">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum publicador encontrado neste grupo.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((field, index) => (
                          <TableRow
                            key={field.id}
                            className={!field.active && !field.id ? 'opacity-60 bg-muted/20' : ''}
                          >
                            <TableCell className="font-medium">
                              <div className="flex flex-col gap-1">
                                <span>{field.name}</span>
                                <div className="flex gap-2">
                                  {!field.active && (
                                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-sm w-fit">
                                      Sistema Inativo
                                    </span>
                                  )}
                                  {field.activity_status === 'Não Participou' && (
                                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm w-fit">
                                      Irregular
                                    </span>
                                  )}
                                  {field.activity_status === 'Inativo' && (
                                    <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-sm w-fit">
                                      Inativo (6 meses)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`reports.${index}.type`}
                                render={({ field: inputField }) => (
                                  <FormItem>
                                    <Select
                                      onValueChange={inputField.onChange}
                                      defaultValue={inputField.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="bg-background min-w-[140px]">
                                          <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="publicador">Publicador</SelectItem>
                                        <SelectItem value="pioneiro_regular">
                                          Pioneiro Regular
                                        </SelectItem>
                                        <SelectItem value="pioneiro_auxiliar">
                                          Pioneiro Auxiliar
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <FormField
                                control={form.control}
                                name={`reports.${index}.participated`}
                                render={({ field: inputField }) => (
                                  <FormItem className="flex items-center justify-center space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={inputField.value}
                                        onCheckedChange={(checked) => {
                                          inputField.onChange(checked)
                                          if (!checked) {
                                            form.setValue(`reports.${index}.hours`, 0)
                                            form.setValue(`reports.${index}.bible_studies`, 0)
                                          }
                                        }}
                                        className={
                                          !inputField.value ? 'border-red-500 shadow-sm' : ''
                                        }
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`reports.${index}.hours`}
                                render={({ field: inputField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          className="w-20 bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={!form.watch(`reports.${index}.participated`)}
                                          {...inputField}
                                          onChange={(e) => {
                                            inputField.onChange(e)
                                            if (Number(e.target.value) > 0) {
                                              form.setValue(`reports.${index}.participated`, true)
                                            }
                                          }}
                                        />
                                        {form.watch(`reports.${index}.type`) ===
                                          'pioneiro_regular' &&
                                          Number(pioneerHourGoal) > 0 && (
                                            <span className="text-xs font-semibold text-primary whitespace-nowrap bg-primary/10 px-1.5 py-0.5 rounded-sm">
                                              / {pioneerHourGoal}h
                                            </span>
                                          )}
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`reports.${index}.bible_studies`}
                                render={({ field: inputField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        className="w-20 bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!form.watch(`reports.${index}.participated`)}
                                        {...inputField}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`reports.${index}.notes`}
                                render={({ field: inputField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="Notas..."
                                        className="bg-background"
                                        {...inputField}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-6 flex justify-end bg-muted/10 border-t mt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSaving || fields.length === 0 || !selectedGroupId}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[180px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando Relatórios...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Atividades
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
