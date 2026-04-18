import pb from '@/lib/pocketbase/client'

export interface Publisher {
  id: string
  name: string
  group_id: string
  type: 'publicador' | 'pioneiro_auxiliar' | 'pioneiro_regular'
  active: boolean
  phone?: string
  address?: string
  notes?: string
  created?: string
  expand?: {
    group_id?: {
      number: number
    }
  }
}

export const getPublishers = () =>
  pb.collection('publishers').getFullList<Publisher>({ expand: 'group_id' })
export const getPublisher = (id: string) =>
  pb.collection('publishers').getOne<Publisher>(id, { expand: 'group_id' })
export const getPublishersByGroup = (groupId: string) =>
  pb
    .collection('publishers')
    .getFullList<Publisher>({ filter: `group_id = '${groupId}'`, expand: 'group_id' })
export const createPublisher = (data: Partial<Publisher>) =>
  pb.collection('publishers').create<Publisher>(data)
export const updatePublisher = (id: string, data: Partial<Publisher>) =>
  pb.collection('publishers').update<Publisher>(id, data)
export const deletePublisher = (id: string) => pb.collection('publishers').delete(id)
