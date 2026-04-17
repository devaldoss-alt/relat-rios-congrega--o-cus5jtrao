import pb from '@/lib/pocketbase/client'

export const getCompilationData = async (year: number, month: number) => {
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`

  const groupReports = await pb.collection('group_reports').getFullList({
    filter: `month="${monthStr}"`,
  })

  // Start of current month in UTC string format
  const startStr = `${year}-${month.toString().padStart(2, '0')}-01 00:00:00.000Z`

  // Start of next month in UTC string format
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01 00:00:00.000Z`

  const meetings = await pb.collection('meeting_attendance').getFullList({
    filter: `meeting_date >= "${startStr}" && meeting_date < "${endStr}"`,
  })

  return { groupReports, meetings }
}
