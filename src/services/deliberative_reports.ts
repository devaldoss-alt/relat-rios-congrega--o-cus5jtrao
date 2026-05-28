import pb from '@/lib/pocketbase/client'

export interface DeliberativeReport {
  id: string
  start_date: string
  end_date: string
  title: string
  content: {
    executive_summary?: string
    spiritual_vitality?: string
    engagement?: string
    pastoring_priorities?: string
    pioneer_performance?: string
    group_analysis?: string
  }
  created_by: string
  created?: string
  updated?: string
}

export const getDeliberativeReports = () =>
  pb.collection('deliberative_reports').getFullList<DeliberativeReport>({ sort: '-created' })
export const getDeliberativeReport = (id: string) =>
  pb.collection('deliberative_reports').getOne<DeliberativeReport>(id)
export const saveDeliberativeReport = async (data: Partial<DeliberativeReport>) => {
  if (data.id)
    return pb.collection('deliberative_reports').update<DeliberativeReport>(data.id, data)
  return pb.collection('deliberative_reports').create<DeliberativeReport>(data)
}
export const deleteDeliberativeReport = (id: string) =>
  pb.collection('deliberative_reports').delete(id)
