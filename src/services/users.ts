import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export const getUsers = () => pb.collection('users').getFullList<RecordModel>({ sort: 'name' })

export const createUser = (data: any) => {
  return pb.collection('users').create({
    ...data,
    passwordConfirm: data.password,
    emailVisibility: true,
  })
}

export const updateUser = (id: string, data: any) => pb.collection('users').update(id, data)

export const adminUpdateUser = (id: string, data: any) =>
  pb.send(`/backend/v1/admin/update-user/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })

export const deleteUser = (id: string) => pb.collection('users').delete(id)
