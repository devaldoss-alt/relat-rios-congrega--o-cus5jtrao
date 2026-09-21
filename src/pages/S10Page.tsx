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
    new_inactive_publishers: 0,
    reactivated_publishers: 0,
    deaf_publishers: 0,
    blind_publishers: 0,
    prisoner_publishers: 0,
    // Campos oficiais S-10 (Página 2)
    total_territory_cards: 0,
    unworked_territory_cards: 0,
    // Legado preservado
    territory_cards_worked: 0,
    territory_percent_covered: 0,
    new_unbaptized_publishers: 0,
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
        // Se já existe registro salvo, utiliza o valor salvo se preenchido; se for indefinido, adota o valor calculado automaticamente
        setFormData({
          avg_attendance_weekend:
            existingRep.avg_attendance_weekend ?? calcData.avgAttendanceWeekend,
          avg_attendance_midweek:
            existingRep.avg_attendance_midweek ?? calcData.avgAttendanceMidweek,
          total_active_publishers:
            existingRep.total_active_publishers ?? calcData.totalActivePublishersAugust,
          new_inactive_publishers:
            existingRep.new_inactive_publishers !== undefined
              ? existingRep.new_inactive_publishers
              : calcData.autoNewInactiveCount,
          reactivated_publishers:
            existingRep.reactivated_publishers !== undefined
              ? existingRep.reactivated_publishers
              : calcData.autoReactivatedCount,
          deaf_publishers: existingRep.deaf_publishers ?? 0,
          blind_publishers: existingRep.blind_publishers ?? 0,
          prisoner_publishers: existingRep.prisoner_publishers ?? 0,
          total_territory_cards: existingRep.total_territory_cards ?? 0,
          unworked_territory_cards: existingRep.unworked_territory_cards ?? 0,
          territory_cards_worked: existingRep.territory_cards_worked ?? 0,
          territory_percent_covered: existingRep.territory_percent_covered ?? 0,
          new_unbaptized_publishers:
            existingRep.new_unbaptized_publishers !== undefined
              ? existingRep.new_unbaptized_publishers
              : calcData.autoNewUnbaptizedCount,
          notes: existingRep.notes ?? '',
        })
      } else {
        setFormData({
          avg_attendance_weekend: calcData.avgAttendanceWeekend,
          avg_attendance_midweek: calcData.avgAttendanceMidweek,
          total_active_publishers: calcData.totalActivePublishersAugust,
          new_inactive_publishers: calcData.autoNewInactiveCount,
          reactivated_publishers: calcData.autoReactivatedCount,
          deaf_publishers: 0,
          blind_publishers: 0,
          prisoner_publishers: 0,
          total_territory_cards: 0,
          unworked_territory_cards: 0,
          territory_cards_worked: 0,
          territory_percent_covered: 0,
          new_unbaptized_publishers: calcData.autoNewUnbaptizedCount,
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
        new_inactive_publishers: formData.new_inactive_publishers,
        reactivated_publishers: formData.reactivated_publishers,
        deaf_publishers: formData.deaf_publishers,
        blind_publishers: formData.blind_publishers,
        prisoner_publishers: formData.prisoner_publishers,
        total_territory_cards: formData.total_territory_cards,
        unworked_territory_cards: formData.unworked_territory_cards,
        // Também mantém atualizado os campos calculados/legados para não quebrar compatibilidade
        territory_cards_worked: Math.max(
          0,
          formData.total_territory_cards - formData.unworked_territory_cards,
        ),
        territory_percent_covered:
          formData.total_territory_cards > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  Math.round(
                    ((formData.total_territory_cards - formData.unworked_territory_cards) /
                      formData.total_territory_cards) *
                      100,
                  ),
                ),
              )
            : 0,
        new_unbaptized_publishers: formData.new_unbaptized_publishers,
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

                {/* Bloco 2: Totais da congregação (Exatamente a ordem e estrutura oficial do hub.jw.org) */}
                <Card>
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Totais da congregação
                    </CardTitle>
                    <CardDescription>
                      Itens oficiais do formulário Análise de Congregação (S-10) para o Ano de
                      Serviço de {serviceYear}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6 divide-y">
                    {/* 1. Todos os publicadores ativos */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2 first:pt-0">
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-sm font-semibold text-foreground">
                          Todos os publicadores ativos
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Conte todas as pessoas na congregação que relataram pelo menos uma vez nos
                          últimos 6 meses.
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

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs">
                        <p className="font-semibold text-foreground mb-1.5">Incluir:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                          <p>• Pioneiros</p>
                          <p>• Publicadores não batizados</p>
                          <p>• Publicadores irregulares</p>
                          <p>• Publicadores reativados</p>
                          <p>• Publicadores surdos</p>
                          <p>• Publicadores cegos</p>
                          <p>• Publicadores presos</p>
                          <p>• Servos de tempo integral especial</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Novos publicadores inativos (CAMPO OFICIAL) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold text-foreground">
                            Novos publicadores inativos
                          </Label>
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal"
                          >
                            Calculado automaticamente
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Conte apenas publicadores que ficaram inativos no último ano de serviço.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={formData.new_inactive_publishers}
                            onChange={(e) =>
                              handleNumberChange('new_inactive_publishers', e.target.value)
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
                                  new_inactive_publishers: calculated?.autoNewInactiveCount ?? 0,
                                }))
                              }}
                            >
                              Auto: {calculated?.autoNewInactiveCount ?? 0}
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {calculated?.autoNewInactiveCount ?? 0} identificado(s) no histórico de
                          relatos
                        </p>
                      </div>

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground space-y-2">
                        <p className="leading-relaxed">
                          Publicadores que não relataram serviço de campo por seis meses
                          consecutivos. Esse período pode ser qualquer período de seis meses durante
                          o último ano de serviço.
                        </p>
                        <p className="leading-relaxed font-medium text-foreground">
                          <strong>Não inclua:</strong> Os que ficaram inativos nos anos de serviço
                          anteriores e continuam inativos.
                        </p>
                        {calculated && calculated.newInactivePublishersList.length > 0 && (
                          <div className="pt-2 border-t border-border/50 text-[11px] text-foreground/80 space-y-1">
                            <span className="font-semibold block text-foreground">
                              Publicadores identificados:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {calculated.newInactivePublishersList.map((p) => (
                                <span
                                  key={p.id}
                                  className="bg-background border rounded px-1.5 py-0.5"
                                >
                                  {p.name} (6 meses sem relatar em {p.inactiveSinceMonth}/
                                  {p.inactiveSinceYear})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Publicadores reativados (CAMPO OFICIAL) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold text-foreground">
                            Publicadores reativados
                          </Label>
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal"
                          >
                            Calculado automaticamente
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Conte os publicadores que estavam inativos, mas que voltaram a relatar
                          serviço de campo em pelo menos um mês no último ano de serviço.
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
                                  reactivated_publishers: calculated?.autoReactivatedCount ?? 0,
                                }))
                              }}
                            >
                              Auto: {calculated?.autoReactivatedCount ?? 0}
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {calculated?.autoReactivatedCount ?? 0} identificado(s) no histórico de
                          relatos
                        </p>
                      </div>

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground space-y-2">
                        <p className="leading-relaxed font-medium text-foreground">
                          Uma mesma pessoa pode ser incluída tanto em <em>Publicadores inativos</em>{' '}
                          como em <em>Publicadores reativados</em>.
                        </p>
                        {calculated && calculated.reactivatedPublishersList.length > 0 && (
                          <div className="pt-2 border-t border-border/50 text-[11px] text-foreground/80 space-y-1">
                            <span className="font-semibold block text-foreground">
                              Publicadores identificados:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {calculated.reactivatedPublishersList.map((p) => (
                                <span
                                  key={p.id}
                                  className="bg-background border rounded px-1.5 py-0.5"
                                >
                                  {p.name} (retomou em {p.resumedMonth}/{p.resumedYear})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. Publicadores surdos (CAMPO OFICIAL) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-sm font-semibold text-foreground">
                          Publicadores surdos
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
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

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground">
                        <p className="leading-relaxed">
                          Publicadores da congregação cuja língua principal de aprendizado ou
                          comunicação seja a língua de sinais.
                        </p>
                      </div>
                    </div>

                    {/* 5. Publicadores cegos (CAMPO OFICIAL) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-sm font-semibold text-foreground">
                          Publicadores cegos
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Conte os publicadores com cegueira total ou severa deficiência visual.
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

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground">
                        <p className="leading-relaxed">
                          Publicadores que necessitam de publicações em braille ou recursos em áudio
                          devido à deficiência visual severa.
                        </p>
                      </div>
                    </div>

                    {/* 6. Publicadores presos (CAMPO OFICIAL) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-sm font-semibold text-foreground">
                          Publicadores presos
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Conte os publicadores que estão sob custódia legal ou internação
                          assistida.
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

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs">
                        <p className="font-semibold text-foreground mb-1.5">
                          Incluir publicadores que estão em:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                          <p>• Prisão provisória</p>
                          <p>• Penitenciária</p>
                          <p>• Hospital psiquiátrico</p>
                          <p>• Clínica de reabilitação para dependentes químicos</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* =============================================================== */}
                {/* INFORMAÇÕES DE APOIO CONGREGACIONAL (Visíveis na tela, FORA da impressão oficial) */}
                {/* =============================================================== */}
                <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/10">
                  <CardHeader className="pb-3 border-b bg-blue-500/5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Informações Adicionais de Apoio Congregacional
                      </CardTitle>
                      <Badge variant="outline" className="text-xs bg-background">
                        Apoio • Fora da impressão oficial
                      </Badge>
                    </div>
                    <CardDescription>
                      Métricas auxiliares para controle da congregação e acompanhamento do
                      Secretário. Estas informações não fazem parte dos campos de envio do S-10 no
                      hub.jw.org.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6 divide-y divide-border/60">
                    {/* Apoio 1: Novos publicadores não batizados */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2 first:pt-0">
                      <div className="md:col-span-5 space-y-2">
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
                        <p className="text-xs text-muted-foreground leading-relaxed">
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

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-semibold text-foreground">Critério congregacional:</p>
                        <p className="leading-relaxed">
                          Pessoas que foram aprovadas pelos anciãos para iniciar como publicadores
                          não batizados e entregaram seu primeiro relato entre setembro/
                          {serviceYear - 1} e agosto/{serviceYear}.
                        </p>
                        {calculated && calculated.newUnbaptizedPublishersList.length > 0 && (
                          <div className="pt-1 border-t border-border/50 text-[11px] text-foreground/80 space-y-1">
                            <span className="font-semibold block text-foreground">
                              Publicadores identificados:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {calculated.newUnbaptizedPublishersList.map((p) => (
                                <span
                                  key={p.id}
                                  className="bg-background border rounded px-1.5 py-0.5"
                                >
                                  {p.name} (1º relato: {p.firstMonth}/{p.firstYear})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Apoio 2: Publicadores readmitidos (Removidos que retornaram após aprovação formal) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-6">
                      <div className="md:col-span-5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold">Publicadores readmitidos</Label>
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal"
                          >
                            Calculado automaticamente
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Pessoas que haviam sido removidas (desassociadas) e foram reintegradas
                          formalmente após aprovação dos anciãos no ano de serviço.
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-foreground">
                            {calculated?.autoReadmittedCount ?? 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            readmitido(s) no período
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {calculated?.autoReadmittedCount ?? 0} com data de readmissão no período
                        </p>
                      </div>

                      <div className="md:col-span-7 rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-semibold text-foreground">
                          Critério e terminologia fixa:
                        </p>
                        <p className="leading-relaxed">
                          Somente pessoas que haviam sido <strong>removidas da congregação</strong>,
                          se arrependeram enquanto estavam fora e retornaram após{' '}
                          <strong>aprovação formal do corpo de anciãos</strong> (campo{' '}
                          <em>Data de readmissão</em> no cadastro).
                        </p>
                        <p className="leading-relaxed text-[11px] text-amber-700 dark:text-amber-400">
                          <strong>Atenção:</strong> Publicadores inativos que retomam os relatos são{' '}
                          <em>reativados</em> (campo oficial acima), sem necessidade de readmissão
                          judicial.
                        </p>
                        {calculated && calculated.readmittedPublishersList.length > 0 && (
                          <div className="pt-1 border-t border-border/50 text-[11px] text-foreground/80 space-y-1">
                            <span className="font-semibold block text-foreground">
                              Readmitidos no período:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {calculated.readmittedPublishersList.map((p) => (
                                <span
                                  key={p.id}
                                  className="bg-background border rounded px-1.5 py-0.5"
                                >
                                  {p.name} ({p.date})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
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

            {/* CONTEÚDO DA PÁGINA 2: Cobertura de Cartões de Território (ESPELHO OFICIAL hub.jw.org) */}
            {currentPage === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* Título Oficial da Seção 2 */}
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                    2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Cobertura de cartões de território
                  </h2>
                </div>

                {/* Container Oficial do Formulário S-10 (idêntico ao JW Hub) */}
                <div className="space-y-3">
                  {/* Bloco 1: Número total de cartões de território */}
                  <div className="rounded-md border border-border bg-card p-4 sm:p-5 shadow-sm space-y-2">
                    <Label
                      htmlFor="total_territory_cards"
                      className="text-sm font-medium text-foreground block cursor-pointer"
                    >
                      Número total de cartões de território
                    </Label>
                    <div>
                      <Input
                        id="total_territory_cards"
                        type="number"
                        min="0"
                        value={
                          formData.total_territory_cards === 0 ? '' : formData.total_territory_cards
                        }
                        onChange={(e) =>
                          handleNumberChange('total_territory_cards', e.target.value)
                        }
                        disabled={!canEdit}
                        className="w-24 sm:w-28 text-base bg-muted/40 font-semibold"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Bloco 2: Cartões de território não trabalhados (com nota oficial ao lado) */}
                  <div className="rounded-md border border-border bg-card p-4 sm:p-5 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-4 space-y-2">
                        <Label
                          htmlFor="unworked_territory_cards"
                          className="text-sm font-medium text-foreground block cursor-pointer"
                        >
                          Cartões de território não trabalhados
                        </Label>
                        <div>
                          <Input
                            id="unworked_territory_cards"
                            type="number"
                            min="0"
                            value={formData.unworked_territory_cards}
                            onChange={(e) =>
                              handleNumberChange('unworked_territory_cards', e.target.value)
                            }
                            disabled={!canEdit}
                            className="w-24 sm:w-28 text-base bg-muted/40 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-8 md:pl-4 md:border-l border-border/60 text-xs sm:text-sm leading-relaxed text-foreground/90 space-y-1">
                        <p>
                          <strong className="text-foreground font-semibold">Não inclua:</strong>{' '}
                          Cartões de território trabalhados em campanhas especiais. Eles são
                          considerados como territórios trabalhados.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de Ação Oficial: [Anterior] [Enviar / Salvar] */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCurrentPage(1)}
                    className="px-5 font-medium"
                  >
                    Anterior
                  </Button>

                  {canEdit && (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-medium shadow-sm"
                    >
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Enviar
                    </Button>
                  )}

                  <Button type="button" variant="outline" onClick={handlePrint} className="ml-auto">
                    <Printer className="w-4 h-4 mr-2" />
                    Visualizar Impressão / PDF
                  </Button>
                </div>

                {/* PAINEL DE APOIO PARA CONFERÊNCIA DO SECRETÁRIO (Fora do formulário oficial / Não impresso) */}
                <Card className="mt-6 border-dashed border-border bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Info className="w-4 h-4 text-blue-500" />
                      Informações de apoio à conferência (Uso Interno)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Indicadores complementares calculados a partir dos dois campos oficiais acima.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-md border bg-card">
                        <span className="text-xs text-muted-foreground block">
                          Cartões trabalhados
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {Math.max(
                            0,
                            formData.total_territory_cards - formData.unworked_territory_cards,
                          )}
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          (Total − Não trabalhados)
                        </span>
                      </div>

                      <div className="p-3 rounded-md border bg-card">
                        <span className="text-xs text-muted-foreground block">
                          Cobertura percentual
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {formData.total_territory_cards > 0
                            ? `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.round(
                                    ((formData.total_territory_cards -
                                      formData.unworked_territory_cards) /
                                      formData.total_territory_cards) *
                                      100,
                                  ),
                                ),
                              )}%`
                            : '0%'}
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Calculado automaticamente
                        </span>
                      </div>

                      <div className="p-3 rounded-md border bg-card">
                        <span className="text-xs text-muted-foreground block">
                          Cartões não trabalhados
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {formData.unworked_territory_cards}
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Saldo de territórios pendentes
                        </span>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 bg-card text-xs space-y-1">
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        Estrutura s10_territories mantida para uso futuro:
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        A coleção de controle individual território a território segue intacta no
                        banco de dados para permitir futuras rotinas cartográficas detalhadas.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs font-semibold">
                        Observações internas do secretário (opcional)
                      </Label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        disabled={!canEdit}
                        rows={2}
                        placeholder="Anotações internas sobre campanhas especiais, territórios rurais ou notas da congregação..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </CardContent>
                </Card>
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
                          Instruções Oficiais / O que incluir
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 1. Todos os publicadores ativos */}
                      <tr>
                        <td className="border border-gray-400 p-2 font-semibold">
                          Todos os publicadores ativos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.total_active_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Conte todas as pessoas na congregação que relataram pelo menos uma vez nos
                          últimos 6 meses.
                          <div className="mt-1 text-[11px] text-gray-600">
                            <strong>Incluir:</strong> Pioneiros, Publicadores não batizados,
                            Publicadores irregulares, Publicadores reativados, Publicadores surdos,
                            Publicadores cegos, Publicadores presos, Servos de tempo integral
                            especial.
                          </div>
                        </td>
                      </tr>

                      {/* 2. Novos publicadores inativos */}
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Novos publicadores inativos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.new_inactive_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Conte apenas publicadores que ficaram inativos no último ano de serviço
                          (não relataram serviço de campo por seis meses consecutivos).
                          <div className="mt-1 text-[11px] text-gray-600">
                            <strong>Não inclua:</strong> Os que ficaram inativos nos anos de serviço
                            anteriores e continuam inativos.
                          </div>
                        </td>
                      </tr>

                      {/* 3. Publicadores reativados */}
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores reativados
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.reactivated_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Conte os publicadores que estavam inativos, mas que voltaram a relatar
                          serviço de campo em pelo menos um mês no último ano de serviço.
                          <div className="mt-1 text-[11px] text-gray-600 italic">
                            Uma mesma pessoa pode ser incluída tanto em Publicadores inativos como
                            em Publicadores reativados.
                          </div>
                        </td>
                      </tr>

                      {/* 4. Publicadores surdos */}
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores surdos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.deaf_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Conte os publicadores que dependem de língua de sinais.
                        </td>
                      </tr>

                      {/* 5. Publicadores cegos */}
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores cegos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.blind_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Conte os publicadores com cegueira total ou severa deficiência visual.
                        </td>
                      </tr>

                      {/* 6. Publicadores presos */}
                      <tr>
                        <td className="border border-gray-400 p-2 font-medium">
                          Publicadores presos
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.prisoner_publishers}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Incluir publicadores que estão em: Prisão provisória, Penitenciária,
                          Hospital psiquiátrico, Clínica de reabilitação para dependentes químicos.
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

                {/* Seção 2: Cobertura de cartões de território (OFICIAL hub.jw.org) */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                    2. Cobertura de cartões de território
                  </h3>
                  <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2 text-left font-semibold">
                          Item / Campo Oficial
                        </th>
                        <th className="border border-gray-400 p-2 text-center w-36 font-semibold">
                          Total
                        </th>
                        <th className="border border-gray-400 p-2 text-left text-xs font-normal text-gray-600">
                          Instruções Oficiais / Notas de Ajuda
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 p-2 font-semibold">
                          Número total de cartões de território
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.total_territory_cards}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          Número total de cartões de território pertencentes à congregação.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 font-semibold">
                          Cartões de território não trabalhados
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold text-base">
                          {formData.unworked_territory_cards}
                        </td>
                        <td className="border border-gray-400 p-2 text-xs">
                          <strong>Não inclua:</strong> Cartões de território trabalhados em
                          campanhas especiais. Eles são considerados como territórios trabalhados.
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-400 p-2 text-xs italic text-gray-700">
                          Cartões trabalhados / Cobertura (Apoio congregacional)
                        </td>
                        <td className="border border-gray-400 p-2 text-center text-xs font-bold text-gray-700">
                          {Math.max(
                            0,
                            formData.total_territory_cards - formData.unworked_territory_cards,
                          )}{' '}
                          (
                          {formData.total_territory_cards > 0
                            ? `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Math.round(
                                    ((formData.total_territory_cards -
                                      formData.unworked_territory_cards) /
                                      formData.total_territory_cards) *
                                      100,
                                  ),
                                ),
                              )}%`
                            : '0%'}
                          )
                        </td>
                        <td className="border border-gray-400 p-2 text-xs text-gray-500 italic">
                          Cálculo de apoio interno: (Total − Não trabalhados) / Total.
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
