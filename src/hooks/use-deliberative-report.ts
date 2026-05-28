import { useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export function useDeliberativeReport() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)

  const loadData = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true)
    try {
      const [sY, sM] = startDate.split('-').map(Number)
      const [eY, eM] = endDate.split('-').map(Number)
      const startCompare = new Date(sY, sM - 1, 1)
      const endCompare = new Date(eY, eM - 1, 1)

      const [publishers, allReports, attendance, groups] = await Promise.all([
        pb.collection('publishers').getFullList({ expand: 'group_id' }),
        pb
          .collection('publisher_reports')
          .getFullList({ expand: 'publisher_id,publisher_id.group_id' }),
        pb.collection('meeting_attendance').getFullList(),
        pb.collection('groups').getFullList(),
      ])

      const periodReports = allReports.filter((r: any) => {
        const d = new Date(r.year, parseInt(r.month) - 1, 1)
        return d >= startCompare && d <= endCompare
      })

      const periodAttendance = attendance.filter((a: any) => {
        const d = new Date(a.meeting_date)
        return d >= startCompare && d <= endCompare
      })

      setData({
        publishers,
        allReports,
        periodReports,
        attendance: periodAttendance,
        groups,
        startDate,
        endDate,
      })

      const newInsights = generateInsights(
        publishers,
        periodReports,
        allReports,
        periodAttendance,
        groups,
        startCompare,
        endCompare,
      )
      setInsights(newInsights)
    } catch (err) {
      toast.error('Falha ao carregar dados do relatório')
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, data, insights, loadData }
}

function generateInsights(
  publishers: any[],
  periodReports: any[],
  allReports: any[],
  attendance: any[],
  groups: any[],
  start: Date,
  end: Date,
) {
  // Executive Summary
  const activeCount = publishers.filter((p) => p.active).length
  const uniqueReporters = new Set(periodReports.map((r) => r.publisher_id)).size
  const participationRate = activeCount ? Math.round((uniqueReporters / activeCount) * 100) : 0

  const execSummary = `A taxa de participação da congregação no período foi de ${participationRate}%. Dos ${activeCount} publicadores ativos, ${uniqueReporters} entregaram pelo menos um relatório.`

  // Spiritual Vitality
  const totalHours = periodReports.reduce((sum, r) => sum + (r.hours || 0), 0)
  const totalStudies = periodReports.reduce((sum, r) => sum + (r.bible_studies || 0), 0)

  const periodMonthsCount =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
  const prevStart = new Date(start.getFullYear(), start.getMonth() - periodMonthsCount, 1)
  const prevEnd = new Date(start.getFullYear(), start.getMonth() - 1, 1)

  const prevReports = allReports.filter((r: any) => {
    const d = new Date(r.year, parseInt(r.month) - 1, 1)
    return d >= prevStart && d <= prevEnd
  })

  const prevTotalHours = prevReports.reduce((sum: number, r: any) => sum + (r.hours || 0), 0)
  const hoursTrend =
    totalHours > prevTotalHours
      ? 'aumentou'
      : totalHours < prevTotalHours
        ? 'diminuiu'
        : 'manteve-se estável'

  const vitality = `A congregação dedicou um total de ${totalHours} horas no ministério e dirigiu ${totalStudies} estudos bíblicos no período analisado. Em comparação com o período anterior equivalente, o total de horas ${hoursTrend}.`

  // Engagement
  const avgInPerson = attendance.length
    ? Math.round(attendance.reduce((s, a) => s + (a.in_person || 0), 0) / attendance.length)
    : 0
  const avgZoom = attendance.length
    ? Math.round(attendance.reduce((s, a) => s + (a.zoom || 0), 0) / attendance.length)
    : 0

  const prevAttendance = attendance.filter((a: any) => {
    const d = new Date(a.meeting_date)
    return d >= prevStart && d <= prevEnd
  })
  const prevAvgInPerson = prevAttendance.length
    ? Math.round(prevAttendance.reduce((s, a) => s + (a.in_person || 0), 0) / prevAttendance.length)
    : 0
  const attendanceTrend =
    avgInPerson > prevAvgInPerson
      ? 'aumentou'
      : avgInPerson < prevAvgInPerson
        ? 'diminuiu'
        : 'manteve-se estável'

  const eng = `A assistência média presencial no período foi de ${avgInPerson} (via Zoom: ${avgZoom}). Em comparação ao período anterior, a assistência presencial ${attendanceTrend}. ${
    avgInPerson > avgZoom * 2
      ? 'Nota-se um forte engajamento presencial.'
      : 'O Zoom ainda representa uma parte significativa da assistência.'
  }`

  // Pastoring Priorities
  const sixMonthsAgo = new Date(end.getFullYear(), end.getMonth() - 6, 1)
  const inactiveNames: string[] = []
  const irregularNames: string[] = []

  publishers.forEach((p) => {
    const pReports = allReports.filter((r) => r.publisher_id === p.id)
    pReports.sort(
      (a, b) =>
        new Date(b.year, parseInt(b.month) - 1, 1).getTime() -
        new Date(a.year, parseInt(a.month) - 1, 1).getTime(),
    )
    const last = pReports[0]
    if (!last) {
      if (p.active) inactiveNames.push(p.name)
    } else {
      const lastD = new Date(last.year, parseInt(last.month) - 1, 1)
      if (lastD < sixMonthsAgo && p.active) irregularNames.push(p.name)
    }
  })

  let pastoring = ''
  if (inactiveNames.length)
    pastoring += `Publicadores sem relatório (Inativos): ${inactiveNames.join(', ')}.\n`
  if (irregularNames.length)
    pastoring += `Publicadores irregulares (+6 meses sem relatar): ${irregularNames.join(', ')}.\n`
  if (!pastoring)
    pastoring =
      'Não há publicadores inativos ou irregulares (+6 meses) identificados neste período.'
  pastoring += '\nSugestão: Pastorear os irmãos irregulares para encorajamento no ministério.'

  // Pioneer Performance
  const regPioneers = publishers.filter((p) => p.type === 'pioneiro_regular')
  const pioneerNamesMeetingGoal: string[] = []
  regPioneers.forEach((p) => {
    const pReps = periodReports.filter((r) => r.publisher_id === p.id)
    const avgH = pReps.length ? pReps.reduce((s, r) => s + (r.hours || 0), 0) / pReps.length : 0
    if (avgH >= 50) pioneerNamesMeetingGoal.push(p.name)
  })
  let pioneerPerf = `Temos ${regPioneers.length} pioneiros regulares.`
  if (pioneerNamesMeetingGoal.length)
    pioneerPerf += ` Atingiram ou superaram a média de 50h: ${pioneerNamesMeetingGoal.join(', ')}.`

  // Group Analysis
  const prevTotalStudies = prevReports.reduce(
    (sum: number, r: any) => sum + (r.bible_studies || 0),
    0,
  )
  const studiesTrend =
    totalStudies < prevTotalStudies
      ? ' Considerando que o número de estudos bíblicos caiu, pode ser útil uma parte local sobre como iniciar e dirigir estudos bíblicos.'
      : ''
  const groupA = `A análise por grupos mostra as variações de participação e produtividade. Sugestão: Superintendentes de grupo com baixos índices podem programar visitas de pastoreio adicionais com base nos dados apresentados.${studiesTrend}`

  return {
    executive_summary: execSummary,
    spiritual_vitality: vitality,
    engagement: eng,
    pastoring_priorities: pastoring,
    pioneer_performance: pioneerPerf,
    group_analysis: groupA,
  }
}
