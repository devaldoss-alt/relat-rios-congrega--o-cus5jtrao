import pb from '@/lib/pocketbase/client'

export const getGroupReport = async (groupId: string, month: string) => {
  try {
    return await pb
      .collection('group_reports')
      .getFirstListItem(`group_id="${groupId}" && month="${month}"`)
  } catch (error: any) {
    if (error.status === 404) return null
    throw error
  }
}

export const createGroupReport = (data: any) => pb.collection('group_reports').create(data)

export const updateGroupReport = (id: string, data: any) =>
  pb.collection('group_reports').update(id, data)
