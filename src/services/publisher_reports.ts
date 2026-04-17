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

export const savePublisherReport = async (data: Partial<PublisherReport>) => {
  if (data.id) {
    return pb.collection('publisher_reports').update<PublisherReport>(data.id, data)
  }
  return pb.collection('publisher_reports').create<PublisherReport>(data)
}
