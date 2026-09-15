import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export type VisitStatus = 'agendada' | 'realizada' | 'cancelada'
export type DerivedVisitStatus = 'agendada' | 'realizada' | 'atrasada' | 'cancelada'

export interface PastoralVisit extends RecordModel {
  target_publisher?: string
  target_family_name?: string
  responsible_elders?: string[]
  primary_elder?: string
  scheduled_date: string
  topic: string
  status: VisitStatus
  completion_date?: string
  notes?: string
  expand?: {
    target_publisher?: {
      id: string
      name: string
      group_id?: string
      phone?: string
      type?: string
      status?: string
      expand?: {
        group_id?: {
          id: string
          number: number
        }
      }
    }
    responsible_elders?: Array<{
      id: string
      name: string
      phone?: string
      email?: string
      role?: string
    }>
    primary_elder?: {
      id: string
      name: string
      phone?: string
      email?: string
      role?: string
    }
  }
}

/**
 * Retorna a situação derivada da visita (por exemplo se a data prevista passou e ainda não foi realizada)
 */
export function getDerivedVisitStatus(visit: PastoralVisit): DerivedVisitStatus {
  if (visit.status === 'cancelada') return 'cancelada'
  if (visit.status === 'realizada') return 'realizada'

  if (!visit.scheduled_date) return 'agendada'

  const visitDate = new Date(visit.scheduled_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  visitDate.setHours(0, 0, 0, 0)

  if (visitDate.getTime() < today.getTime()) {
    return 'atrasada'
  }
  return 'agendada'
}

export async function getPastoralVisits(
  filter?: string,
  sort = 'scheduled_date',
): Promise<PastoralVisit[]> {
  return (await pb.collection('pastoral_visits').getFullList({
    filter,
    sort,
    expand: 'target_publisher,target_publisher.group_id,responsible_elders,primary_elder',
  })) as PastoralVisit[]
}

export async function getPastoralVisit(id: string): Promise<PastoralVisit> {
  return (await pb.collection('pastoral_visits').getOne(id, {
    expand: 'target_publisher,target_publisher.group_id,responsible_elders,primary_elder',
  })) as PastoralVisit
}

export async function createPastoralVisit(data: Partial<PastoralVisit>): Promise<PastoralVisit> {
  return (await pb.collection('pastoral_visits').create(data, {
    expand: 'target_publisher,target_publisher.group_id,responsible_elders,primary_elder',
  })) as PastoralVisit
}

export async function updatePastoralVisit(
  id: string,
  data: Partial<PastoralVisit>,
): Promise<PastoralVisit> {
  return (await pb.collection('pastoral_visits').update(id, data, {
    expand: 'target_publisher,target_publisher.group_id,responsible_elders,primary_elder',
  })) as PastoralVisit
}

export async function deletePastoralVisit(id: string): Promise<boolean> {
  return await pb.collection('pastoral_visits').delete(id)
}
