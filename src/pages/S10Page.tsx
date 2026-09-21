import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Printer,
  Save,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Info,
  Building,
} from 'lucide-react'
import { GuideDialog } from '@/components/GuideDialog'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  S10Report,
  getS10ReportByServiceYear,
  saveS10Report,
  calculateS10Data,
  S10CalculatedData,
} from '@/services/s10'

function getCurrentServiceYear() {
  const now = new Date()
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
}

export default function S10Page() {
  const { user } = useAuth()
  const { toast } = useToast()

  const isSecretario = user?.role === 'Secretário'
  const isResponsavel = user?.role === 'Responsável'
  const isAnciao = user?.role === 'Ancião'

  const canEdit = isSecretario || isResponsavel
  const canView = isSecretario || isResponsavel || isAnciao

  const currentSY = useMemo(() => getCurrentServiceYear(), [])
  const [serviceYear, setServiceYear] = useState<number>(currentSY)
  const [currentPage, setCurrentPage] = useState<1 | 2>(1)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [report, setReport] = useState<S10Report | null>(null)
  const [calculated, setCalculated] = useState<S10CalculatedData | null>(null)

  // Campos do formulário (com defaults zerados)
  const [formData, setFormData] = useState({
    avg_attendance_weekend: 0,
    avg_attendance_midweek: 0,
    total_active_publishers: 0,
    new_unbaptized_publishers: 0,
    reactivated_publishers: 0,
    deaf_publishers: 0,
    blind_publishers: 0,
    prisoner_publishers: 0,
    territory_cards_worked: 0,
    territory_percent_covered: 0,
    notes: '',
  })

  // Lista de anos de serviço disponíveis (ano atual + 4 anos anteriores)
  const serviceYearOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => currentSY - i)
  }, [currentSY])

  const loadData = async () => {
    setLoading(true)
    try {
      const [existingRep, calcData] = await Promise.all([
        getS10ReportByServiceYear(serviceYear),
        calculateS10Data(serviceYear),
      ])

      setReport(existingRep)
      setCalculated(calcData)

      if (existingRep) {
        // Se já existe registro salvo, utiliza o valor salvo se preenchido; se for 0 ou indefinido, adota o valor calculado automaticamente
        setFormData({
          avg_attendance_weekend:
            existingRep.avg_attendance_weekend ?? calcData.avgAttendanceWeekend,
          avg_attendance_midweek:
            existingRep.avg_attendance_midweek ?? calcData.avgAttendanceMidweek,
          total_active_publishers:
            existingRep.total_active_publishers ?? calcData.totalActivePublishersAugust,
          new_unbaptized_publishers:
            existingRep.new_unbaptized_publishers !== undefined &&
            existingRep.new_unbaptized_publishers > 0
              ? existingRep.new_unbaptized_publishers
              : calcData.autoNewUnbaptizedCount,
          reactivated_publishers:
            existingRep.reactivated_publishers !== undefined &&
            existingRep.reactivated_publishers > 0
              ? existingRep.reactivated_publishers
              : calcData.autoReadmittedCount,
          deaf_publishers: existingRep.deaf_publishers ?? 0,
          blind_publishers: existingRep.blind_publishers ?? 0,
          prisoner_publishers: existingRep.prisoner_publishers ?? 0,
          territory_cards_worked: existingRep.territory_cards_worked ?? 0,
          territory_percent_covered: existingRep.territory_percent_covered ?? 0,
          notes: existingRep.notes ?? '',
        })
      } else {
        setFormData({
          avg_attendance_weekend: calcData.avgAttendanceWeekend,
          avg_attendance_midweek: calcData.avgAttendanceMidweek,
          total_active_publishers: calcData.totalActivePublishersAugust,
          new_unbaptized_publishers: calcData.autoNewUnbaptizedCount,
          reactivated_publishers: calcData.autoReadmittedCount,
          deaf_publishers: 0,
          blind_publishers: 0,
          prisoner_publishers: 0,
          territory_cards_worked: 0,
          territory_percent_covered: 0,
          notes: '',
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados do S-10:', err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar a análise deste ano de serviço.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [serviceYear])

  const handleNumberChange = (field: keyof typeof formData, valueStr: string) => {
    if (!canEdit) return
    const val = valueStr === '' ? 0 : parseInt(valueStr, 10)
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(val) ? 0 : Math.max(0, val),
    }))
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      const payload: Partial<S10Report> = {
        ...(report?.id ? { id: report.id } : {}),
        service_year: serviceYear,
        avg_attendance_weekend: formData.avg_attendance_weekend,
        avg_attendance_midweek: formData.avg_attendance_midweek,
        total_active_publishers: formData.total_active_publishers,
        new_unbaptized_publishers: formData.new_unbaptized_publishers,
        reactivated_publishers: formData.reactivated_publishers,
        deaf_publishers: formData.deaf_publishers,
        blind_publishers: formData.blind_publishers,
        prisoner_publishers: formData.prisoner_publishers,
        territory_cards_worked: formData.territory_cards_worked,
        territory_percent_covered: formData.territory_percent_covered,
        notes: formData.notes,
        updated_by: user?.id,
      }

      const saved = await saveS10Report(payload)
      setReport(saved)
      toast({
        title: 'Relatório S-10 salvo',
        description: `Dados do Ano de Serviço de ${serviceYear} salvos com sucesso!`,
      })
    } catch (err: any) {
      console.error('Erro ao salvar S-10:', err)
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
      </div>
    )
  }

  const serviceYearPeriod = `setembro/${serviceYear - 1} a agosto/${serviceYear}`

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in-up">
      {/* CABEÇALHO NA TELA (Oculto na impressão) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
              Formulário Oficial
            </Badge>
            <span className="text-xs text-muted-foreground">S-10</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Análise de Congregação (S-10)</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ano de serviço de {serviceYear} ({serviceYearPeriod})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <GuideDialog />

          <Select
            value={serviceYear.toString()}
            onValueChange={(v) => setServiceYear(parseInt(v, 10))}
            disabled={loading}
          >
            <SelectTrigger className="w-[190px] bg-background">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Ano de Serviço" />
            </SelectTrigger>
            <SelectContent>
              {serviceYearOptions.map((sy) => (
                <SelectItem key={sy} value={sy.toString()}>
                  Ano de Serviço {sy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handlePrint} className="shrink-0" disabled={loading}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir / PDF
          </Button>

          {canEdit && (
            <Button onClick={handleSave} disabled={loading || saving} className="shrink-0">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          )}
        </div>
      </div>

      {/* AVISO DE MODO SOMENTE LEITURA PARA ANCIÃO */}
      {!canEdit && (
        <Alert className="bg-muted/50 border-border print:hidden">
          <Info className="h-4 w-4" />
          <AlertTitle>Modo de Consulta (Acesso de Ancião)</AlertTitle>
          <AlertDescription>
            Você está visualizando a Análise de Congregação (S-10) em modo somente leitura. O
            preenchimento é realizado pelo Secretário ou Responsável.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4 print:hidden">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* =============================================================== */}
          {/* VISUALIZAÇÃO INTERATIVA EM 2 PÁGINAS (TELA - print:hidden)      */}
          {/* =============================================================== */}
          <div className="space-y-6 print:hidden">
            {/* Box explicativo idêntico ao cabeçalho oficial do JW Hub */}
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    As informações neste relatório são baseadas no{' '}
                    <strong className="text-foreground">
                      Registro da Assistência às Reuniões Congregacionais (S-88)
                    </strong>{' '}
                    e nos{' '}
                    <strong className="text-foreground">
                      Registros de Publicador de Congregação (S-21)
                    </strong>{' '}
                    do último ano de serviço (setembro a agosto).
                  </p>
                  <p className="text-xs">
                    Se sua congregação foi criada durante o ano de serviço que passou, use como base
                    para seu relatório os meses em que sua congregação estava ativa.
                  </p>
                </div>
              </div>
            </div>

            {/* Abas / Indicador de Passos */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors pb-1 border-b-2 -mb-[18px] ${
                    currentPage === 1
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  Assistência e publicadores
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors pb-1 border-b-2 -mb-[18px] ${
                    currentPage === 2
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  Cobertura de cartões de território
                </button>
              </div>

              <div className="text-xs text-muted-foreground hidden sm:block">
                Página {currentPage} de 2
              </div>
            </div>

            {/* CONTEÚDO DA PÁGINA 1: Assistência e Publicadores */}
            {currentPage === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-sm text-muted-foreground">
                  Insira os resultados do último ano de serviço e clique em{' '}
                  <strong className="text-foreground">Próximo</strong>.
                </div>

                {/* Bloco 1: Média de assistência às reuniões */}
                <Card>
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Média de assistência às reuniões
                    </CardTitle>
                    <CardDescription>
                      Calculada automaticamente das reuniões lançadas no S-88 durante o ano de
                      serviço ({serviceYearPeriod}).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Reunião do fim de semana</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.avg_attendance_weekend}
                            onChange={(e) =>
                              handleNumberChange('avg_attendance_weekend', e.target.value)
                            }
                            disabled={!canEdit}
                            className="w-32 text-lg font-semibold"
                          />
                          <p className="text-xs text-muted-foreground">
                            {calculated?.totalWeekendMeetings ?? 0} reuniões de fim de semana
                            computadas no período.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Reunião do meio de semana</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.avg_attendance_midweek}
                            onChange={(e) =>
                              handleNumberChange('avg_attendance_midweek', e.target.value)
                            }
                            disabled={!canEdit}
                            className="w-32 text-lg font-semibold"
                          />
                          <p className="text-xs text-muted-foreground">
                            {calculated?.totalMidweekMeetings ?? 0} reuniões de meio de semana
                            computadas no período.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-md border p-4 bg-muted/30 self-start text-xs space-y-2">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Info className="w-4 h-4 text-blue-500" />
                          Regra oficial de cálculo:
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Arredonde o resultado para o número inteiro (sem vírgula) mais próximo. O
                          sistema já efetuou o arredondamento automático com base em todas as
                          reuniões registradas.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          Caso haja reuniões especiais ou ajustes locais aprovados pelo corpo de
                          anciãos, o Secretário pode ajustar o valor no campo.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloco 2: Totais da congregação */}
                <Card>
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Totais da congregação
                    </CardTitle>
                    <CardDescription>
                      Fotografia de agosto ({serviceYear}) e contagens especiais para a filial.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6 divide-y">
                    {/* Linha: Todos os publicadores ativos */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2 first:pt-0">
                      <div className="md:col-span-4 space-y-2">
                        <Label className="text-sm font-semibold">
                          Todos os publicadores ativos
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Conte todas as pessoas na congregação que relataram pelo menos uma vez nos
                          últimos 6 meses (fotografia do fechamento de agosto).
                        </p>
                        <Input
                          type="number"
                          min="0"
                          value={formData.total_active_publishers}
                          onChange={(e) =>
                            handleNumberChange('total_active_publishers', e.target.value)
                          }
                          disabled={!canEdit}
                          className="w-32 text-lg font-semibold"
                        />
                        {calculated?.augustSummaryFound && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sincronizado com histórico de
                            agosto/{serviceYear}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-8 rounded-md border p-3 bg-muted/20 text-xs">
                        <p className="font-semibold text-foreground mb-1.5">Incluir:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                          <p>• Pioneiros</p>
                          <p>• Publicadores surdos</p>
                          <p>• Publicadores não batizados</p>
                          <p>• Publicadores cegos</p>
                          <p>• Publicadores irregulares</p>
                          <p>• Publicadores presos</p>
                          <p>• Publicadores reativados</p>
                          <p>• Servos de tempo integral especial</p>
                        </div>
                      </div>
                    </div>

                    {/* Linha: Novos publicadores não batizados */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold">
                            Novos publicadores não batizados
                          </Label>
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal"
                          >
                            Calculado automaticamente
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Pessoas aprovadas como novos publicadores não batizados cujo primeiro
                          relato foi registrado durante o ano de serviço.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={formData.new_unbaptized_publishers}
                            onChange={(e) =>
                              handleNumberChange('new_unbaptized_publishers', e.target.value)
                            }
                            disabled={!canEdit}
                            className="w-32 text-lg font-semibold"
                          />
                          {canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 px-2"
                              title="Restaurar valor calculado automaticamente"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  new_unbaptized_publishers:
                                    calculated?.autoNewUnbaptizedCount ?? 0,
                                }))
                              }}
                            >
                              Auto: {calculated?.autoNewUnbaptizedCount ?? 0}
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {calculated?.autoNewUnbaptizedCount ?? 0} identificado(s) no histórico de
                          relatos
                        </p>
                      </div>

                      <div className="md:col-span-8 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-semibold text-foreground">Critério oficial:</p>
                        <p className="leading-relaxed">
                          Pessoas que foram aprovadas pelos anciãos para iniciar como publicadores
                          não batizados e entregaram seu primeiro relato entre setembro/
                          {serviceYear - 1} e agosto/{serviceYear}.
                        </p>
                        {calculated && calculated.newUnbaptizedPublishersList.length > 0 && (
                          <div className="pt-1 border-t border-border/50 text-[11px] text-foreground/80">
                            <strong>Publicadores detectados:</strong>{' '}
                            {calculated.newUnbaptizedPublishersList
                              .map((p) => `${p.name} (1º relato: ${p.firstMonth}/${p.firstYear})`)
                              .join('; ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Linha: Publicadores readmitidos */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold">Publicadores readmitidos</Label>
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal"
                          >
                            Calculado automaticamente
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Exclusivo para pessoas que eram removidas (desassociadas) e foram
                          reintegradas formalmente após aprovação dos anciãos no ano de serviço.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={formData.reactivated_publishers}
                            onChange={(e) =>
                              handleNumberChange('reactivated_publishers', e.target.value)
                            }
                            disabled={!canEdit}
                            className="w-32 text-lg font-semibold"
                          />
                          {canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 px-2"
                              title="Restaurar valor calculado automaticamente"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  reactivated_publishers: calculated?.autoReadmittedCount ?? 0,
                                }))
                              }}
                            >
                              Auto: {calculated?.autoReadmittedCount ?? 0}
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {calculated?.autoReadmittedCount ?? 0} com data de readmissão no período
                        </p>
                      </div>

                      <div className="md:col-span-8 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-semibold text-foreground">
                          Critério oficial e terminologia:
                        </p>
                        <p className="leading-relaxed">
                          Somente pessoas que haviam sido <strong>removidas da congregação</strong>,
                          se arrependeram enquanto estavam fora e retornaram após{' '}
                          <strong>aprovação formal do corpo de anciãos</strong>. O sistema conta
                          automaticamente quem possui o campo <em>Data de readmissão</em> no
                          cadastro entre setembro/{serviceYear - 1} e agosto/{serviceYear}.
                        </p>
                        <p className="leading-relaxed text-[11px] text-amber-700 dark:text-amber-400">
                          <strong>Atenção:</strong> Publicadores inativos que voltaram a relatar são{' '}
                          <em>reativados</em> (não são readmitidos e nunca saíram do registro).
                        </p>
                        {calculated && calculated.readmittedPublishersList.length > 0 && (
                          <div className="pt-1 border-t border-border/50 text-[11px] text-foreground/80">
                            <strong>Readmitidos no período:</strong>{' '}
                            {calculated.readmittedPublishersList
                              .map((p) => `${p.name} (${p.date})`)
                              .join('; ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Informativo de Apoio: Publicadores Reativados (Não altera campos do formulário oficial S-10) */}
                    <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <h4 className="text-sm font-semibold text-foreground">
                              Informação de Apoio Congregacional: Publicadores Reativados
                            </h4>
                            <Badge variant="outline" className="text-[10px] bg-background">
                              Apoio ao Secretário
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Publicadores que ficaram{' '}
                            <strong>6+ meses consecutivos sem relatar</strong> e retomaram os
                            relatos durante o Ano de Serviço de {serviceYear} (nunca saíram do
                            registro congregacional). O formulário oficial impresso do S-10 não
                            possui campo isolado para eles; eles são incluídos diretamente no total
                            de <em>Todos os publicadores ativos</em>.
                          </p>
                        </div>
                        <div className="text-right shrink-0 bg-background rounded-md border px-3 py-1.5 shadow-xs">
                          <span className="text-xs text-muted-foreground block">
                            Reativados no ano
                          </span>
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {calculated?.autoReactivatedCount ?? 0}
                          </span>
                        </div>
                      </div>

                      {calculated && calculated.reactivatedPublishersList.length > 0 && (
                        <div className="rounded border bg-background/80 p-2 text-xs space-y-1">
                          <p className="font-medium text-foreground text-[11px]">
                            Publicadores que retomaram a atividade no período:
                          </p>
                          <div className="flex flex-wrap gap-2 text-muted-foreground text-[11px]">
                            {calculated.reactivatedPublishersList.map((p) => (
                              <span key={p.id} className="bg-muted px-2 py-0.5 rounded">
                                • {p.name} (retomou em {p.resumedMonth}/{p.resumedYear})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Linha: Publicadores surdos */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-4 space-y-2">
                        <Label className="text-sm font-semibold">Publicadores surdos</Label>
                        <p className="text-xs text-muted-foreground">
                          Conte os publicadores que dependem de língua de sinais.
                        </p>
                        <Input
                          type="number"
                          min="0"
                          value={formData.deaf_publishers}
                          onChange={(e) => handleNumberChange('deaf_publishers', e.target.value)}
                          disabled={!canEdit}
                          className="w-32 text-lg font-semibold"
                        />
                      </div>

                      <div className="md:col-span-8 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground mb-1">Observação:</p>
                        <p className="leading-relaxed">
                          Publicadores ativos da congregação que utilizam a língua de sinais como
                          meio principal de comunicação.
                        </p>
                      </div>
                    </div>

                    {/* Linha: Publicadores cegos */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-4 space-y-2">
                        <Label className="text-sm font-semibold">Publicadores cegos</Label>
                        <p className="text-xs text-muted-foreground">
                          Conte os publicadores com deficiência visual severa ou cegueira total.
                        </p>
                        <Input
                          type="number"
                          min="0"
                          value={formData.blind_publishers}
                          onChange={(e) => handleNumberChange('blind_publishers', e.target.value)}
                          disabled={!canEdit}
                          className="w-32 text-lg font-semibold"
                        />
                      </div>

                      <div className="md:col-span-8 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground mb-1">Observação:</p>
                        <p className="leading-relaxed">
                          Publicadores que dependem de publicações em braille ou recursos em áudio
                          devido à deficiência visual.
                        </p>
                      </div>
                    </div>

                    {/* Linha: Publicadores presos */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-4 space-y-2">
                        <Label className="text-sm font-semibold">Publicadores presos</Label>
                        <p className="text-xs text-muted-foreground">
                          Conte os publicadores que estão sob custódia ou internados.
                        </p>
                        <Input
                          type="number"
                          min="0"
                          value={formData.prisoner_publishers}
                          onChange={(e) =>
                            handleNumberChange('prisoner_publishers', e.target.value)
                          }
                          disabled={!canEdit}
                          className="w-32 text-lg font-semibold"
                        />
                      </div>

                      <div className="md:col-span-8 rounded-md border p-3 bg-muted/20 text-xs">
                        <p className="font-semibold text-foreground mb-1.5">
                          Incluir publicadores que estão em:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                          <p>• Prisão provisória</p>
                          <p>• Hospital psiquiátrico</p>
                          <p>• Penitenciária</p>
                          <p>• Clínica de reabilitação para dependentes químicos</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Botões de Ação na base da Página 1 */}
                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      loadData()
                      toast({ title: 'Valores recarregados' })
                    }}
                  >
                    Recarregar Médias
                  </Button>

                  <div className="flex gap-2">
                    {canEdit && (
                      <Button variant="secondary" onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Rascunho
                      </Button>
                    )}
                    <Button onClick={() => setCurrentPage(2)}>
                      Próximo <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA PÁGINA 2: Cobertura de Cartões de Território */}
            {currentPage === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-sm text-muted-foreground">
                  Insira as informações finais sobre os territórios trabalhados no ano de serviço de{' '}
                  <strong className="text-foreground">{serviceYear}</strong>.
                </div>

                <Card>
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Cobertura de cartões de território
                    </CardTitle>
                    <CardDescription>
                      Lançamento da quantidade de cartões/territórios trabalhados e porcentagem
                      total coberta no ano de serviço ({serviceYearPeriod}).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Quantidade de cartões/territórios trabalhados
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Total de cartões de território da congregação que foram trabalhados
                          durante o ano de serviço.
                        </p>
                        <Input
                          type="number"
                          min="0"
                          value={formData.territory_cards_worked}
                          onChange={(e) =>
                            handleNumberChange('territory_cards_worked', e.target.value)
                          }
                          disabled={!canEdit}
                          className="w-40 text-lg font-semibold"
                          placeholder="Ex: 48"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Porcentagem do território coberta (%)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Estimativa ou cálculo percentual de todo o território designado trabalhado
                          ao longo do ano de serviço.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.territory_percent_covered}
                            onChange={(e) =>
                              handleNumberChange('territory_percent_covered', e.target.value)
                            }
                            disabled={!canEdit}
                            className="w-32 text-lg font-semibold"
                            placeholder="Ex: 85"
                          />
                          <span className="text-lg font-bold text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border p-4 bg-muted/20 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <Info className="w-4 h-4 text-primary" />
                        Estrutura s10_territories preparada:
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        A coleção de controle individual de territórios já está criada no banco de
                        dados para permitir futuras rotinas detalhadas por mapa. No momento, o
                        formulário S-10 consolida o valor final da congregação.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label className="text-sm font-semibold">Observações (opcional)</Label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        disabled={!canEdit}
                        rows={3}
                        placeholder="Anotações internas sobre campanhas especiais, territórios rurais ou notas da congregação..."
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Botões de Ação na base da Página 2 */}
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" onClick={() => setCurrentPage(1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar à Página 1
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" />
                      Visualizar Impressão / PDF
                    </Button>

                    {canEdit && (
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Concluir e Salvar S-10
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* LAYOUT DE IMPRESSÃO / PDF NO PADRÃO DO S-1                      */}
          {/* (Visível apenas ao imprimir: hidden print:block)                 */}
          {/* Aprendizado do projeto: sem fixed inset-0, classes simples A4    */}
          {/* =============================================================== */}
          <div className="hidden print:block text-black bg-white">
            {/* PÁGINA 1 DA IMPRESSÃO */}
            <div
              className="p-8 max-w-[800px] mx-auto min-h-[1050px] flex flex-col justify-between"
              style={{ pageBreakAfter: 'always' }}
            >
              <div>
                {/* Cabeçalho Oficial S-10 */}
                <div className="border-b-2 border-black pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold uppercase tracking-wider">
                        Análise de Congregação
                      </h1>
                      <h2 className="text-lg font-bold text-gray-800">S-10</h2>
                      <p className="text-sm mt-1">
                        Ano de Serviço de <strong>{serviceYear}</strong> ({serviceYearPeriod})
                      </p>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <p>
                        <strong>Congregação:</strong> Macaúbas
                      </p>
                      <p>
                        <strong>Secretário:</strong> {user?.name || 'Não informado'}
                      </p>
                      <p>
                        <strong>Data da emissão:</strong> {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Texto explicativo oficial */}
                <div className="border border-gray-400 p-3 text-xs leading-relaxed mb-6 bg-gray-50">
                  <p>
                    As informações neste relatório são baseadas no{' '}
                    <em>Registro da Assistência às Reuniões Congregacionais (S-88)</em> e nos{' '}
                    <em>Registros de Publicador de Congregação (S-21)</em> do último ano de serviço
                    (setembro a agosto).
                  </p>
                </div>

                {/* Seção 1: Média de assistência às reuniões */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                    1. Média de assistência às reuniões
                  </h3>
                  <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2 text-left font-semibold">
                          Reunião
                        </th>
                        <th className="border border-gray-400 p-2 text-center w-36 font-semibold">
                          Média Anual
                        </th>
                        <th className="border border-gray-400 p-2 text-left text-xs font-normal text-gray-600">
                          Critério
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Reunião do fim de semana
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.avg_attendance_weekend}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs text-gray-600">
                          Arredondado para número inteiro mais próximo (
                          {calculated?.totalWeekendMeetings || 0} reuniões)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Reunião do meio de semana
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.avg_attendance_midweek}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs text-gray-600">
                          Arredondado para número inteiro mais próximo (
                          {calculated?.totalMidweekMeetings || 0} reuniões)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Seção 2: Totais da congregação */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                    2. Totais da congregação
                  </h3>
                  <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2 text-left font-semibold">
                          Item / Categoria
                        </th>
                        <th className="border border-gray-400 p-2 text-center w-28 font-semibold">
                          Total
                        </th>
                        <th className="border border-gray-400 p-2 text-left text-xs font-normal text-gray-600">
                          Instruções / O que incluir
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 p-2 font-semibold">
                          Todos os publicadores ativos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.total_active_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Pessoas que relataram pelo menos 1 vez nos últimos 6 meses (fotografia de
                          agosto). Inclui pioneiros, não batizados, irregulares, reativados, surdos,
                          cegos e presos.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Novos publicadores não batizados
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.new_unbaptized_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Aprovados durante o último ano de serviço.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores readmitidos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.reactivated_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Pessoas que eram removidas e foram readmitidas após aprovação formal dos
                          anciãos no ano de serviço.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores surdos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.deaf_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Publicadores que dependem de língua de sinais.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores cegos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.blind_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Publicadores com deficiência visual severa ou cegueira total.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores presos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.prisoner_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Prisão provisória, penitenciária, hospital psiquiátrico ou clínica de
                          reabilitação.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rodapé da Página 1 */}
              <div className="pt-6 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <span>Formulário S-10 (Página 1 de 2)</span>
                <span>Macaúbas • Ano de Serviço {serviceYear}</span>
              </div>
            </div>

            {/* PÁGINA 2 DA IMPRESSÃO */}
            <div className="p-8 max-w-[800px] mx-auto min-h-[1050px] flex flex-col justify-between">
              <div>
                {/* Cabeçalho da Página 2 */}
                <div className="border-b-2 border-black pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold uppercase tracking-wider">
                        Análise de Congregação
                      </h1>
                      <h2 className="text-lg font-bold text-gray-800">
                        S-10 — Página 2 (Territórios)
                      </h2>
                      <p className="text-sm mt-1">
                        Ano de Serviço de <strong>{serviceYear}</strong> ({serviceYearPeriod})
                      </p>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <p>
                        <strong>Congregação:</strong> Macaúbas
                      </p>
                      <p>
                        <strong>Página:</strong> 2 de 2
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seção 3: Cobertura de cartões de território */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                    3. Cobertura de cartões de território
                  </h3>
                  <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2 text-left font-semibold">
                          Indicador de Território
                        </th>
                        <th className="border border-gray-400 p-2 text-center w-36 font-semibold">
                          Resultado
                        </th>
                        <th className="border border-gray-400 p-2 text-left text-xs font-normal text-gray-600">
                          Descrição
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Cartões de território trabalhados
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.territory_cards_worked}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Quantidade total de cartões/territórios designados trabalhados no ano.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Porcentagem coberta
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.territory_percent_covered}%
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Percentual estimado do território total da congregação trabalhado.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Observações */}
                {formData.notes && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
                      Observações Adicionais
                    </h3>
                    <div className="border border-gray-400 p-3 text-xs leading-relaxed whitespace-pre-wrap bg-gray-50">
                      {formData.notes}
                    </div>
                  </div>
                )}

                {/* Bloco de Assinaturas no padrão S-1 */}
                <div className="mt-12 pt-8 border-t border-gray-400">
                  <div className="grid grid-cols-2 gap-12 text-center text-xs">
                    <div>
                      <div className="border-b border-black mb-2 pb-8"></div>
                      <p className="font-semibold">Coordenador do Corpo de Anciãos</p>
                      <p className="text-gray-500">Assinatura / Data</p>
                    </div>
                    <div>
                      <div className="border-b border-black mb-2 pb-8"></div>
                      <p className="font-semibold">Secretário da Congregação</p>
                      <p className="text-gray-500">Assinatura / Data</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé da Página 2 */}
              <div className="pt-6 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <span>Formulário S-10 (Página 2 de 2)</span>
                <span>Macaúbas • Arquivo Congregacional</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
