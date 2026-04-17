import pb from '@/lib/pocketbase/client'

export interface MonthlySummary {
  id: string
  month: string
  year: number
  total_active_publishers: number
  avg_attendance_midweek: number
  avg_attendance_weekend: number
  report_data: any
  created: string
  updated: string
}

export const getMonthlySummaries = () =>
  pb.collection('monthly_summaries').getFullList<MonthlySummary>({ sort: '-year,-month' })
export const getMonthlySummary = (id: string) =>
  pb.collection('monthly_summaries').getOne<MonthlySummary>(id)
export const createMonthlySummary = (data: Partial<MonthlySummary>) =>
  pb.collection('monthly_summaries').create<MonthlySummary>(data)
export const updateMonthlySummary = (id: string, data: Partial<MonthlySummary>) =>
  pb.collection('monthly_summaries').update<MonthlySummary>(id, data)
export const findMonthlySummary = (year: number, month: string) =>
  pb
    .collection('monthly_summaries')
    .getFirstListItem<MonthlySummary>(`year = ${year} && month = '${month}'`)
    .catch(() => null)
