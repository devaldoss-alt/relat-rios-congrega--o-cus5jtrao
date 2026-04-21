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
  birth_date?: string
  baptism_date?: string
  gender?: 'Masculino' | 'Feminino'
  hope?: 'Outras ovelhas' | 'Ungido'
  is_elder?: boolean
  is_ministerial_servant?: boolean
  is_special_pioneer?: boolean
  is_field_missionary?: boolean
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
