import pb from '@/lib/pocketbase/client'

export interface Group {
  id: string
  number: number
  leader?: string
}

export const getGroups = () => pb.collection('groups').getFullList<Group>({ sort: 'number' })
