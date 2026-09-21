import pb from '@/lib/pocketbase/client'

export interface S10Report {
  id?: string
  service_year: number
  avg_attendance_weekend?: number
  avg_attendance_midweek?: number
  total_active_publishers?: number
  new_unbaptized_publishers?: number
  new_inactive_publishers?: number
  reactivated_publishers?: number
  deaf_publishers?: number
  blind_publishers?: number
  prisoner_publishers?: number
  territory_cards_worked?: number
  territory_percent_covered?: number
  notes?: string
  updated_by?: string
  created?: string
  updated?: string
}

export interface S10Territory {
  id?: string
  number: string
  name?: string
  service_year?: number
  work_date?: string
  coverage_percent?: number
  status?: string
  notes?: string
  created?: string
  updated?: string
}

export const getS10ReportByServiceYear = async (serviceYear: number): Promise<S10Report | null> => {
  try {
    return await pb
      .collection('s10_reports')
      .getFirstListItem<S10Report>(`service_year = ${serviceYear}`)
  } catch (err: any) {
    if (err?.status === 404) return null
    throw err
  }
}

export const saveS10Report = async (data: Partial<S10Report>): Promise<S10Report> => {
  if (data.id) {
    return await pb.collection('s10_reports').update<S10Report>(data.id, data)
  }
  // Se não tem ID, verifica se já existe registro com esse service_year para evitar erro de UNIQUE
  if (data.service_year) {
    const existing = await getS10ReportByServiceYear(data.service_year)
    if (existing?.id) {
      return await pb.collection('s10_reports').update<S10Report>(existing.id, data)
    }
  }
  return await pb.collection('s10_reports').create<S10Report>(data)
}

export const getS10Territories = async (serviceYear?: number): Promise<S10Territory[]> => {
  const filter = serviceYear ? `service_year = ${serviceYear}` : ''
  return await pb.collection('s10_territories').getFullList<S10Territory>({
    filter,
    sort: '+number',
  })
}

export interface S10CalculatedData {
  avgAttendanceWeekend: number
  avgAttendanceMidweek: number
  totalActivePublishersAugust: number
  augustSummaryFound: boolean
  totalWeekendMeetings: number
  totalMidweekMeetings: number
  // Cálculos automáticos do formulário oficial S-10:
  autoNewInactiveCount: number
  newInactivePublishersList: {
    id: string
    name: string
    inactiveSinceMonth: string
    inactiveSinceYear: number
  }[]
  autoReactivatedCount: number
  reactivatedPublishersList: {
    id: string
    name: string
    resumedMonth: string
    resumedYear: number
  }[]
  // Apoio congregacional:
  autoNewUnbaptizedCount: number
  newUnbaptizedPublishersList: { id: string; name: string; firstMonth: string; firstYear: number }[]
  autoReadmittedCount: number
  readmittedPublishersList: { id: string; name: string; date: string }[]
}

/**
 * Retorna se uma data YYYY-MM-DD cai no período do Ano de Serviço (01/09/startYear a 31/08/endYear)
 */
function isDateInServiceYear(
  dateStr: string | undefined | null,
  startYear: number,
  endYear: number,
): boolean {
  if (!dateStr) return false
  const dateOnly = dateStr.slice(0, 10) // 'YYYY-MM-DD'
  const startLimit = `${startYear}-09-01`
  const endLimit = `${endYear}-08-31`
  return dateOnly >= startLimit && dateOnly <= endLimit
}

/**
 * Converte mês/ano em número ordinal contínuo para comparações temporais
 */
function toMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1)
}

/**
 * Calcula os dados consolidados do Ano de Serviço (setembro a agosto):
 * 1. Médias de assistência às reuniões (Fim de semana e Meio de semana) ao longo de todo o ano de serviço
 *    a partir de meeting_attendance.
 * 2. Total de publicadores ativos = FOTOGRAFIA DE AGOSTO (mês 08 do serviceYear),
 *    usando a regra consolidada (monthly_summaries ou fallback via computeFallbackData).
 *    Readmitidos no ano que estão ativos voltam a contar como ativos normalmente na fotografia.
 * 3. Readmitidos: contagem automática de publicadores cujo `readmission_date` cai no ano de serviço.
 * 4. Novos não batizados: primeiro relato no sistema cai no ano de serviço E sem batismo até aquele relato.
 * 5. Reativados no ano de serviço: publicadores (nunca Removidos) que ficaram 6+ meses sem relatar e retomaram no ano de serviço.
 */
export const calculateS10Data = async (serviceYear: number): Promise<S10CalculatedData> => {
  const startYear = serviceYear - 1
  const endYear = serviceYear

  // 1. Assistência às reuniões durante o ano de serviço: de 1 de setembro (startYear) a 31 de agosto (endYear)
  const startDateStr = `${startYear}-09-01 00:00:00`
  const endDateStr = `${endYear}-08-31 23:59:59`

  const [attendanceList, allPublishers, allReports] = await Promise.all([
    pb
      .collection('meeting_attendance')
      .getFullList({
        filter: `meeting_date >= '${startDateStr}' && meeting_date <= '${endDateStr}'`,
        sort: '+meeting_date',
      })
      .catch(() => []),
    pb
      .collection('publishers')
      .getFullList()
      .catch(() => []),
    pb
      .collection('publisher_reports')
      .getFullList({
        sort: '+year,+month',
      })
      .catch(() => []),
  ])

  let mwSum = 0
  let mwCount = 0
  let weSum = 0
  let weCount = 0

  for (const item of attendanceList) {
    const total = (Number(item.in_person) || 0) + (Number(item.zoom) || 0)
    if (item.meeting_type === 'quinta') {
      mwSum += total
      mwCount++
    } else {
      weSum += total
      weCount++
    }
  }

  const avgAttendanceMidweek = mwCount > 0 ? Math.round(mwSum / mwCount) : 0
  const avgAttendanceWeekend = weCount > 0 ? Math.round(weSum / weCount) : 0

  // 2. Readmitidos no Ano de Serviço:
  // Publicadores cujo readmission_date cai entre 01/09/(serviceYear-1) e 31/08/serviceYear
  const readmittedPublishersList: { id: string; name: string; date: string }[] = []
  for (const pub of allPublishers) {
    if (pub.readmission_date && isDateInServiceYear(pub.readmission_date, startYear, endYear)) {
      readmittedPublishersList.push({
        id: pub.id,
        name: pub.name,
        date: pub.readmission_date.slice(0, 10),
      })
    }
  }
  const autoReadmittedCount = readmittedPublishersList.length

  // 3. Fotografia de agosto do ano de serviço
  let totalActivePublishersAugust = 0
  let augustSummaryFound = false

  // Tenta buscar no monthly_summaries de agosto do endYear
  const augustSummary = await pb
    .collection('monthly_summaries')
    .getFirstListItem(`year = ${endYear} && (month = '08' || month = '8')`)
    .catch(() => null)

  if (augustSummary && Number(augustSummary.total_active_publishers) > 0) {
    totalActivePublishersAugust = Number(augustSummary.total_active_publishers)
    augustSummaryFound = true
  } else {
    // Se não encontrou ou está zerado, calcula usando a regra consolidada de atividade de agosto
    // Pegando os relatórios dos 6 meses anteriores a agosto (março a agosto de endYear)
    try {
      const { getPublisherReportsFor6Months, calculateActivityStatus } =
        await import('./publisher_reports')
      const pubReports6m = await getPublisherReportsFor6Months(8, endYear)

      let activeCount = 0
      for (const pub of allPublishers) {
        // Removido ou Mudou-se saem da contagem.
        // SE o publicador foi readmitido no ano de serviço e seu status atual é Ativo / Inativo (Apoio),
        // ele participa normalmente da contagem.
        const isArchived = pub.status === 'Mudou-se' || pub.status === 'Removido'
        if (isArchived) continue

        const status = calculateActivityStatus(pub.id, pubReports6m as any, 8, endYear)
        if (status !== 'Inativo') {
          activeCount++
        }
      }
      totalActivePublishersAugust = activeCount
    } catch (e) {
      console.error('Erro ao calcular fotografia de agosto para o S-10:', e)
    }
  }

  // 4. Mapeamento de todos os relatórios por publicador
  // Guardamos se participou ou não mês a mês para permitir calcular inatividade (6 meses sem relatar) e reativações
  const reportsByPublisher = new Map<
    string,
    Map<number, { participated: boolean; month: number; year: number }>
  >()

  for (const rep of allReports) {
    const m = parseInt(rep.month, 10)
    const y = Number(rep.year)
    if (!m || !y) continue

    const pubId = rep.publisher_id
    if (!pubId) continue

    if (!reportsByPublisher.has(pubId)) {
      reportsByPublisher.set(pubId, new Map())
    }
    const didParticipate = Boolean(rep.participated || Number(rep.hours) > 0)
    const mIdx = toMonthIndex(y, m)
    reportsByPublisher.get(pubId)!.set(mIdx, {
      participated: didParticipate,
      month: m,
      year: y,
    })
  }

  const syStartIdx = toMonthIndex(startYear, 9) // Setembro do startYear (ex: set/2025)
  const syEndIdx = toMonthIndex(endYear, 8) // Agosto do endYear (ex: ago/2026)

  const newUnbaptizedPublishersList: {
    id: string
    name: string
    firstMonth: string
    firstYear: number
  }[] = []

  const reactivatedPublishersList: {
    id: string
    name: string
    resumedMonth: string
    resumedYear: number
  }[] = []

  const newInactivePublishersList: {
    id: string
    name: string
    inactiveSinceMonth: string
    inactiveSinceYear: number
  }[] = []

  for (const pub of allPublishers) {
    // Se o publicador é 'Removido' (desassociado), não entra no cálculo de novos inativos ou reativados
    const isRemoved = pub.status === 'Removido'
    const pubMonthMap = reportsByPublisher.get(pub.id)

    // Lista de meses em que o publicador teve relato ativo
    const activeMonthIndices: number[] = []
    if (pubMonthMap) {
      for (const [mIdx, info] of pubMonthMap.entries()) {
        if (info.participated) {
          activeMonthIndices.push(mIdx)
        }
      }
      activeMonthIndices.sort((a, b) => a - b)
    }

    // 4.1 Novos publicadores não batizados:
    // Primeiro relato no sistema cai dentro do ano de serviço selecionado
    // E sem batismo até o primeiro relato (ou seja: baptism_date vazio OU data de batismo posterior ao primeiro relato)
    if (activeMonthIndices.length > 0) {
      const firstActiveIdx = activeMonthIndices[0]
      if (firstActiveIdx >= syStartIdx && firstActiveIdx <= syEndIdx) {
        const firstInfo = pubMonthMap!.get(firstActiveIdx)!
        let isUnbaptizedAtFirstReport = false
        if (!pub.baptism_date) {
          isUnbaptizedAtFirstReport = true
        } else {
          const baptismDateOnly = pub.baptism_date.slice(0, 10)
          const firstReportMonthStr = `${firstInfo.year}-${String(firstInfo.month).padStart(2, '0')}-01`
          if (baptismDateOnly > firstReportMonthStr) {
            isUnbaptizedAtFirstReport = true
          }
        }

        if (isUnbaptizedAtFirstReport) {
          newUnbaptizedPublishersList.push({
            id: pub.id,
            name: pub.name,
            firstMonth: String(firstInfo.month).padStart(2, '0'),
            firstYear: firstInfo.year,
          })
        }
      }
    }

    // Se é removido, não calculamos inativos nem reativados
    if (isRemoved) {
      continue
    }

    // 4.2 Publicadores Reativados no ano de serviço:
    // Pessoas que estavam inativas (6+ meses consecutivos sem relatar) e voltaram a relatar
    // pelo menos um mês no último ano de serviço (dentro do intervalo syStartIdx .. syEndIdx).
    // Conforme instrução oficial: "Uma mesma pessoa pode ser incluída tanto em Publicadores inativos como em Publicadores reativados".
    if (activeMonthIndices.length > 0) {
      for (let i = 0; i < activeMonthIndices.length; i++) {
        const currIdx = activeMonthIndices[i]
        // O relato de retomada deve ter ocorrido dentro do ano de serviço
        if (currIdx < syStartIdx || currIdx > syEndIdx) continue

        // Para ser considerado reativado, precisava estar inativo imediatamente antes desse relato ativo:
        // Ou seja, antes de currIdx, passaram-se 6 ou mais meses sem relatar.
        if (i === 0) {
          // Se for o primeiro relato registrado no sistema, verificamos se ele já era publicador batizado há mais de 6 meses
          // Se não há histórico anterior ou foi criado agora como novo não batizado, não conta como reativado
          if (pub.baptism_date) {
            const bDate = pub.baptism_date.slice(0, 10)
            const bYear = parseInt(bDate.slice(0, 4), 10)
            const bMonth = parseInt(bDate.slice(5, 7), 10)
            if (bYear && bMonth) {
              const bIdx = toMonthIndex(bYear, bMonth)
              if (currIdx - bIdx >= 7) {
                const info = pubMonthMap!.get(currIdx)!
                reactivatedPublishersList.push({
                  id: pub.id,
                  name: pub.name,
                  resumedMonth: String(info.month).padStart(2, '0'),
                  resumedYear: info.year,
                })
                break
              }
            }
          }
        } else {
          const prevIdx = activeMonthIndices[i - 1]
          const gap = currIdx - prevIdx
          // gap >= 7 significa pelo menos 6 meses consecutivos sem relatar
          if (gap >= 7) {
            const info = pubMonthMap!.get(currIdx)!
            reactivatedPublishersList.push({
              id: pub.id,
              name: pub.name,
              resumedMonth: String(info.month).padStart(2, '0'),
              resumedYear: info.year,
            })
            break // Conta 1 vez por publicador no ano de serviço
          }
        }
      }
    }

    // 4.3 Novos publicadores inativos:
    // "Conte apenas publicadores que ficaram inativos no último ano de serviço.
    // Publicadores que não relataram serviço de campo por seis meses consecutivos.
    // Esse período pode ser qualquer período de seis meses durante o último ano de serviço.
    // Não inclua: Os que ficaram inativos nos anos de serviço anteriores e continuam inativos."
    //
    // Regra precisa:
    // Um publicador completa 6 meses consecutivos sem relatar no mês M (ex: mIdx).
    // O marco do 6º mês consecutivo sem relatar (mIdx) cai no ano de serviço: [syStartIdx, syEndIdx].
    // E antes de começar essa sequência de 6 meses, a pessoa relatou (ou seja, estava ativa imediatamente antes),
    // NÃO vindo já inativa de anos de serviço anteriores.
    // Também pode ter ficado inativo no ano e retornado mais tarde (ou não).
    //
    // Verificamos cada mês M dentro do ano de serviço [syStartIdx, syEndIdx]:
    // M é o 6º mês de uma sequência consecutiva de 6 meses sem relato (M-5 até M).
    // E no mês imediatamente anterior (M-6), o publicador TEVE relato ativo.
    // Se essa condição for atendida em qualquer mês M dentro do ano de serviço, o publicador
    // ficou inativo DURANTE o ano de serviço pela 1ª vez naquele ano!
    let becameInactiveInSy = false
    let inactiveMarcoIdx = -1

    if (pubMonthMap) {
      for (let mIdx = syStartIdx; mIdx <= syEndIdx; mIdx++) {
        // Verifica se os 6 meses consecutivos terminando em mIdx (mIdx-5 até mIdx) foram SEM relato
        let all6NoReport = true
        for (let k = 0; k < 6; k++) {
          const checkIdx = mIdx - k
          const rec = pubMonthMap.get(checkIdx)
          if (rec && rec.participated) {
            all6NoReport = false
            break
          }
        }

        if (all6NoReport) {
          // Para ser NOVO inativo no ano (e não alguém que já era inativo de anos anteriores),
          // no mês imediatamente anterior (mIdx - 6) ele DEVE ter relatado atividade
          const prevMonthRec = pubMonthMap.get(mIdx - 6)
          const hadReportBefore = prevMonthRec?.participated

          if (hadReportBefore) {
            becameInactiveInSy = true
            inactiveMarcoIdx = mIdx
            break
          }
        }
      }
    }

    // Se o publicador está marcado com status "Inativo (Apoio)" no cadastro e não foi pego pelo critério acima
    // (por exemplo, congregações com lançamentos parciais no banco onde o publicador se tornou inativo no ano),
    // verificamos se o último relato dele caiu entre março/(startYear) e fevereiro/(endYear), o que faria
    // os 6 meses sem relatar completarem exatamente dentro do ano de serviço.
    if (!becameInactiveInSy && pub.status === 'Inativo (Apoio)') {
      if (activeMonthIndices.length > 0) {
        const lastActive = activeMonthIndices[activeMonthIndices.length - 1]
        // Se o último relato ocorreu de modo que o 6º mês consecutivo sem relato (lastActive + 6)
        // cai dentro do ano de serviço [syStartIdx, syEndIdx]:
        const sixMonthsAfter = lastActive + 6
        if (sixMonthsAfter >= syStartIdx && sixMonthsAfter <= syEndIdx) {
          becameInactiveInSy = true
          inactiveMarcoIdx = sixMonthsAfter
        }
      }
    }

    if (becameInactiveInSy && inactiveMarcoIdx !== -1) {
      const inactiveYear = Math.floor(inactiveMarcoIdx / 12)
      const inactiveMonth = (inactiveMarcoIdx % 12) + 1
      newInactivePublishersList.push({
        id: pub.id,
        name: pub.name,
        inactiveSinceMonth: String(inactiveMonth).padStart(2, '0'),
        inactiveSinceYear: inactiveYear,
      })
    }
  }

  return {
    avgAttendanceWeekend,
    avgAttendanceMidweek,
    totalActivePublishersAugust,
    augustSummaryFound,
    totalWeekendMeetings: weCount,
    totalMidweekMeetings: mwCount,
    autoNewInactiveCount: newInactivePublishersList.length,
    newInactivePublishersList,
    autoReactivatedCount: reactivatedPublishersList.length,
    reactivatedPublishersList,
    autoNewUnbaptizedCount: newUnbaptizedPublishersList.length,
    newUnbaptizedPublishersList,
    autoReadmittedCount,
    readmittedPublishersList,
  }
}
