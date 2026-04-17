import pb from '@/lib/pocketbase/client'

export const getMembers = () => pb.collection('members').getFullList({ sort: 'name' })
export const createMember = (data: any) => pb.collection('members').create(data)
export const deleteMember = (id: string) => pb.collection('members').delete(id)
