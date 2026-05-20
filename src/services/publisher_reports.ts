import pb from '@/lib/pocketbase/client'

export interface PublisherReport {
  id: string
  publisher_id: string
  month: string
  year: number
  participated?: boolean
  hours: number
  bible_studies: number
  notes: string
  type?: string
}

export const getPublisherReports = (groupId: string, month: string, year: number) => {
  return pb.collection('publisher_reports').getFullList<PublisherReport>({
    filter: `publisher_id.group_id = '${groupId}' && month = '${month}' && year = ${year}`,
  })
}

export const getAllPublisherReportsForMonth = (month: string, year: number) => {
  return pb.collection('publisher_reports').getFullList<PublisherReport>({
    filter: `month = '${month}' && year = ${year}`,
    expand: 'publisher_id,publisher_id.group_id',
  })
}

export const getPublisherReportsFor6Months = async (endMonth: number, endYear: number) => {
  const filters = []
  for (let i = 0; i < 6; i++) {
    let m = endMonth - i
    let y = endYear
    if (m <= 0) {
      m += 12
      y -= 1
    }
    const mStr = m.toString().padStart(2, '0')
    filters.push(`(month = '${mStr}' && year = ${y})`)
  }
  return pb.collection('publisher_reports').getFullList<PublisherReport>({
    filter: filters.join(' || '),
    expand: 'publisher_id,publisher_id.group_id',
  })
}

export const getPublisherReportsHistory = async (publisherId: string, limit = 12) => {
  return pb.collection('publisher_reports').getList<PublisherReport>(1, limit, {
    filter: `publisher_id = '${publisherId}'`,
    sort: '-year,-month',
    expand: 'publisher_id',
  })
}

export const getPublisherReportsByServiceYear = async (
  publisherId: string,
  serviceYear: number,
) => {
  const startYear = serviceYear - 1
  const endYear = serviceYear
  return pb.collection('publisher_reports').getFullList<PublisherReport>({
    filter: `publisher_id = '${publisherId}' && ((year = ${startYear} && month >= '09') || (year = ${endYear} && month <= '08'))`,
    sort: 'year,month',
  })
}

export const savePublisherReport = async (data: Partial<PublisherReport>) => {
  if (data.id) {
    return pb.collection('publisher_reports').update<PublisherReport>(data.id, data)
  }
  return pb.collection('publisher_reports').create<PublisherReport>(data)
}

export const saveMultiplePublisherReports = async (reports: Partial<PublisherReport>[]) => {
  return Promise.all(reports.map((r) => savePublisherReport(r)))
}

export const calculateActivityStatus = (
  pubId: string,
  reports: PublisherReport[],
  refMonth: number,
  refYear: number,
): 'Ativo' | 'Não Participou' | 'Inativo' => {
  let participatedInRefMonth = false
  let participatedInLast5Months = false

  for (let i = 0; i < 6; i++) {
    let m = refMonth - i
    let y = refYear
    if (m <= 0) {
      m += 12
      y -= 1
    }
    const mStr = m.toString().padStart(2, '0')

    const rep = reports.find(
      (r) =>
        (r.publisher_id === pubId || r.expand?.publisher_id?.id === pubId) &&
        r.month === mStr &&
        r.year === y,
    )

    const didParticipate = rep?.participated || (rep?.hours && rep.hours > 0) || false

    if (i === 0) {
      participatedInRefMonth = didParticipate
    } else {
      if (didParticipate) participatedInLast5Months = true
    }
  }

  if (participatedInRefMonth) return 'Ativo'
  if (participatedInLast5Months) return 'Não Participou'
  return 'Inativo'
}
