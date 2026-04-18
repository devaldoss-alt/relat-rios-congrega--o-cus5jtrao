import pb from '@/lib/pocketbase/client'

export interface Group {
  id: string
  number: number
  leader?: string
  hour_goal?: number
}

export const getGroups = () => pb.collection('groups').getFullList<Group>({ sort: 'number' })
export const updateGroup = (id: string, data: Partial<Group>) =>
  pb.collection('groups').update<Group>(id, data)
