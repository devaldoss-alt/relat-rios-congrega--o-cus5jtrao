import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export type AlertSeverity = 'baixa' | 'media' | 'alta' | 'critica'
export type AlertType =
  | 'relatorio_pendente'
  | 'publicador_5_meses'
  | 'publicador_6_meses_critico'
  | 'prazo_s1'
  | 'acao_ata_vencendo'
  | 'acao_ata_atrasada'
  | 'pastoreio'
  | 'visita_agendada'
  | 'visita_atrasada'
  | 'geral'
export type AlertStatus = 'pendente' | 'resolvido'

export interface SystemAlert extends RecordModel {
  title: string
  description?: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  group_number?: number
  group_id?: string
  responsible_user?: string
  target_publisher?: string
  due_date?: string
  reference_month?: string
  wa_link?: string
  metadata?: any
  expand?: {
    group_id?: RecordModel
    responsible_user?: RecordModel
    target_publisher?: RecordModel
  }
}

export async function getAlerts(filter?: string, sort = '-created'): Promise<SystemAlert[]> {
  return (await pb.collection('alerts').getFullList({
    filter,
    sort,
    expand: 'group_id,responsible_user,target_publisher',
  })) as SystemAlert[]
}

export async function getPendingAlerts(): Promise<SystemAlert[]> {
  return (await pb.collection('alerts').getFullList({
    filter: "status = 'pendente'",
    sort: '-created',
    expand: 'group_id,responsible_user,target_publisher',
  })) as SystemAlert[]
}

export async function createAlert(data: Partial<SystemAlert>): Promise<SystemAlert> {
  return (await pb.collection('alerts').create(data)) as SystemAlert
}

export async function updateAlert(id: string, data: Partial<SystemAlert>): Promise<SystemAlert> {
  return (await pb.collection('alerts').update(id, data)) as SystemAlert
}

export async function resolveAlert(id: string): Promise<SystemAlert> {
  return (await pb.collection('alerts').update(id, { status: 'resolvido' })) as SystemAlert
}

export async function triggerAlertsEngine(): Promise<{ success: boolean; message?: string }> {
  try {
    return await pb.send('/backend/v1/trigger-alerts', { method: 'POST' })
  } catch (err: any) {
    console.error('Falha ao disparar motor de alertas:', err)
    return { success: false, message: err?.message || 'Erro de conexão' }
  }
}

export async function sendElderNotificationEmail(payload: {
  email: string
  subject: string
  message: string
}): Promise<{ success: boolean; delivered?: boolean }> {
  try {
    return await pb.send('/backend/v1/send-elder-notification', {
      method: 'POST',
      body: payload,
    })
  } catch (err: any) {
    console.error('Falha ao enviar e-mail de notificação:', err)
    return { success: false }
  }
}

/**
 * Monta link wa.me pronto para envio rápido pelo WhatsApp
 */
export function buildWhatsAppLink(phone: string | undefined, message: string): string {
  if (!phone) {
    const encoded = encodeURIComponent(message)
    return `https://wa.me/?text=${encoded}`
  }
  // Limpar formatação
  let cleanNumber = phone.replace(/\D/g, '')
  if (cleanNumber.length === 10 || cleanNumber.length === 11) {
    cleanNumber = '55' + cleanNumber
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}
