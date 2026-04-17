import pb from '@/lib/pocketbase/client'

export const getReports = () => pb.collection('reports').getFullList({ sort: '-meeting_date' })
export const createReport = (data: any) => pb.collection('reports').create(data)
export const deleteReport = (id: string) => pb.collection('reports').delete(id)
