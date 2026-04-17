import pb from '@/lib/pocketbase/client'

export const getMeetingAttendance = async () => {
  return await pb.collection('meeting_attendance').getFullList({ sort: '-meeting_date' })
}

export const syncMeetingAttendance = async () => {
  return await pb.send('/backend/v1/sync-attendance', { method: 'POST' })
}
