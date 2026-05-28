import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer, Save, FileText } from 'lucide-react'
import { useDeliberativeReport } from '@/hooks/use-deliberative-report'
import { ExecutiveSummaryCard } from '@/components/deliberative-report/ExecutiveSummaryCard'
import { VitalityCharts } from '@/components/deliberative-report/VitalityCharts'
import { EngagementAnalysis } from '@/components/deliberative-report/EngagementAnalysis'
import { PastoringPriorities } from '@/components/deliberative-report/PastoringPriorities'
import { PioneerPerformance } from '@/components/deliberative-report/PioneerPerformance'
import { ObservationSection } from '@/components/deliberative-report/ObservationSection'
import { GroupPerformanceAnalytics } from '@/components/deliberative-report/GroupPerformanceAnalytics'
import { saveDeliberativeReport } from '@/services/deliberative_reports'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'

export default function DeliberativeReportPage() {
  const { user } = useAuth()
  const { loading, data, insights, loadData } = useDeliberativeReport()
  const [savedReports, setSavedReports] = useState<any[]>([])

  const now = new Date()
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() - 5).padStart(2, '0')}-01`

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)

  const [observations, setObservations] = useState({
    executive_summary: '',
    spiritual_vitality: '',
    engagement: '',
    pastoring_priorities: '',
    pioneer_performance: '',
    group_analysis: '',
  })

  const [isLoadedFromSaved, setIsLoadedFromSaved] = useState(false)

  useEffect(() => {
    if (user?.role === 'Secretário') {
      import('@/services/deliberative_reports').then(({ getDeliberativeReports }) => {
        getDeliberativeReports().then(setSavedReports).catch(console.error)
      })
    }
  }, [user])

  useEffect(() => {
    if (insights && !isLoadedFromSaved) {
      setObservations(insights)
    }
  }, [insights, isLoadedFromSaved])

  if (user?.role !== 'Secretário') {
    return <Navigate to="/dashboard" replace />
  }

  const updateObs = (key: string, value: string) => {
    setObservations((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerate = () => {
    setIsLoadedFromSaved(false)
    loadData(startDate, endDate)
  }
  const handlePrint = () => window.print()

  const handleSave = async () => {
    try {
      await saveDeliberativeReport({
        title: `Relatório Deliberativo ${startDate} a ${endDate}`,
        start_date: `${startDate} 00:00:00.000Z`,
        end_date: `${endDate} 23:59:59.000Z`,
        content: observations,
        created_by: user.id,
      })
      toast.success('Relatório salvo com sucesso!')
      import('@/services/deliberative_reports').then(({ getDeliberativeReports }) => {
        getDeliberativeReports().then(setSavedReports).catch(console.error)
      })
    } catch (err) {
      toast.error('Erro ao salvar relatório.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Relatório Deliberativo
          </h1>
          <p className="text-muted-foreground text-sm">
            Gere um diagnóstico da saúde espiritual da congregação.
          </p>
        </div>

        <div className="flex items-end gap-3 bg-card p-3 rounded-lg border">
          <div className="space-y-1">
            <Label htmlFor="start">Início</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end">Fim</Label>
            <Input
              id="end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            Gerar
          </Button>

          {savedReports.length > 0 && (
            <div className="space-y-1 ml-1 pl-4 border-l">
              <Label>Carregar Salvo</Label>
              <select
                className="flex h-9 w-[200px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  if (!e.target.value) return
                  const r = savedReports.find((x) => x.id === e.target.value)
                  if (r) {
                    setIsLoadedFromSaved(true)
                    const sDate = r.start_date.split(' ')[0]
                    const eDate = r.end_date.split(' ')[0]
                    setStartDate(sDate)
                    setEndDate(eDate)
                    setObservations(r.content || {})
                    loadData(sDate, eDate)
                  }
                }}
              >
                <option value="">Selecione...</option>
                {savedReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {data && (
        <div className="bg-background md:p-8 md:border md:rounded-xl md:shadow-sm print:p-0 print:border-none print:shadow-none">
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-3xl font-bold">Relatório de Análise Deliberativa</h1>
            <p className="text-muted-foreground">
              Período: {startDate} a {endDate}
            </p>
          </div>

          <div className="flex justify-end gap-2 mb-6 print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir PDF
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Salvar Relatório
            </Button>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                1. O Termômetro (Resumo Executivo)
              </h2>
              <ExecutiveSummaryCard data={data} />
              <ObservationSection
                title="Resumo Executivo"
                value={observations.executive_summary}
                onChange={(v) => updateObs('executive_summary', v)}
              />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">2. Vitalidade Espiritual</h2>
              <VitalityCharts data={data} />
              <ObservationSection
                title="Vitalidade Espiritual"
                value={observations.spiritual_vitality}
                onChange={(v) => updateObs('spiritual_vitality', v)}
              />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                3. Engajamento Presencial
              </h2>
              <EngagementAnalysis data={data} />
              <ObservationSection
                title="Engajamento"
                value={observations.engagement}
                onChange={(v) => updateObs('engagement', v)}
              />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                4. Prioridades de Pastoreio
              </h2>
              <PastoringPriorities data={data} />
              <ObservationSection
                title="Prioridades de Pastoreio"
                value={observations.pastoring_priorities}
                onChange={(v) => updateObs('pastoring_priorities', v)}
              />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                5. Desempenho dos Pioneiros
              </h2>
              <PioneerPerformance data={data} />
              <ObservationSection
                title="Desempenho dos Pioneiros"
                value={observations.pioneer_performance}
                onChange={(v) => updateObs('pioneer_performance', v)}
              />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">6. Análise por Grupos</h2>
              <GroupPerformanceAnalytics data={data} />
              <ObservationSection
                title="Análise por Grupos"
                value={observations.group_analysis}
                onChange={(v) => updateObs('group_analysis', v)}
              />
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
