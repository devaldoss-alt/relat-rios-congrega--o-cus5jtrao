import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export type ActionStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
export type ActionPriority = 'baixa' | 'media' | 'alta' | 'urgente'

export interface MeetingMinute extends RecordModel {
  title: string
  meeting_date: string
  raw_content?: string
  attachment?: string
  created_by: string
  expand?: {
    created_by?: RecordModel
  }
}

export interface MinuteAction extends RecordModel {
  minute_id?: string
  title: string
  description?: string
  assigned_to?: string
  assigned_name?: string
  group_number?: number
  due_date?: string
  status: ActionStatus
  priority: ActionPriority
  notes?: string
  completed_at?: string
  expand?: {
    minute_id?: MeetingMinute
    assigned_to?: RecordModel
  }
}

export async function getMeetingMinutes(): Promise<MeetingMinute[]> {
  return (await pb.collection('meeting_minutes').getFullList({
    sort: '-meeting_date,-created',
    expand: 'created_by',
  })) as MeetingMinute[]
}

export async function createMeetingMinute(
  data: FormData | Partial<MeetingMinute>,
): Promise<MeetingMinute> {
  return (await pb.collection('meeting_minutes').create(data)) as MeetingMinute
}

export async function updateMeetingMinute(
  id: string,
  data: FormData | Partial<MeetingMinute>,
): Promise<MeetingMinute> {
  return (await pb.collection('meeting_minutes').update(id, data)) as MeetingMinute
}

export async function deleteMeetingMinute(id: string): Promise<boolean> {
  return await pb.collection('meeting_minutes').delete(id)
}

export async function getMinutesActions(filter?: string): Promise<MinuteAction[]> {
  return (await pb.collection('minutes_actions').getFullList({
    filter,
    sort: 'status,due_date,-created',
    expand: 'minute_id,assigned_to',
  })) as MinuteAction[]
}

export async function createMinuteAction(data: Partial<MinuteAction>): Promise<MinuteAction> {
  return (await pb.collection('minutes_actions').create(data)) as MinuteAction
}

export async function updateMinuteAction(
  id: string,
  data: Partial<MinuteAction>,
): Promise<MinuteAction> {
  return (await pb.collection('minutes_actions').update(id, data)) as MinuteAction
}

export async function deleteMinuteAction(id: string): Promise<boolean> {
  return await pb.collection('minutes_actions').delete(id)
}
