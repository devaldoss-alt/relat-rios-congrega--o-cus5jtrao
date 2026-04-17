import pb from '@/lib/pocketbase/client'

export const getGroups = () => pb.collection('groups').getFullList({ sort: 'number' })
