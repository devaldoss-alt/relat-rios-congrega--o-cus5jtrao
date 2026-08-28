import React, { useState } from 'react'
import { Group } from '@/services/groups'
import { Publisher } from '@/services/publishers'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Printer, FileText, List } from 'lucide-react'

interface PrintPublishersDialogProps {
  groups: Group[]
  publishers: Publisher[]
}

type ReportType = 'names_only' | 'full_details'

export function PrintPublishersDialog({ groups, publishers }: PrintPublishersDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [reportType, setReportType] = useState<ReportType>('names_only')

  // Filter and organize publishers for printing
  const sortedGroups = [...groups].sort((a, b) => a.number - b.number)

  // Active publishers only for the report or all based on normal congregation view
  const targetPublishers = publishers.filter((p) => {
    // Only non-archived members by default (or standard active/inactive)
    const isArchived = p.status === 'Mudou-se' || p.status === 'Removido'
    if (isArchived) return false
    if (selectedGroup !== 'all' && p.group_id !== selectedGroup) return false
    return true
  })

  // Grouping
  const groupsToDisplay =
    selectedGroup === 'all' ? sortedGroups : sortedGroups.filter((g) => g.id === selectedGroup)

  const handlePrint = () => {
    setTimeout(() => {
      window.print()
    }, 150)
  }

  const formatTypeLabel = (type: Publisher['type']) => {
    switch (type) {
      case 'pioneiro_regular':
        return 'Pioneiro Regular'
      case 'pioneiro_auxiliar':
        return 'Pioneiro Auxiliar'
      case 'publicador':
      default:
        return 'Publicador'
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Lista
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Imprimir Lista de Publicadores
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Group Selection */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Selecione o Grupo</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Grupos</SelectItem>
                  {sortedGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      Grupo {g.number} {g.leader ? `(${g.leader})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Tipo de Relatório</Label>
              <RadioGroup
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
                className="grid grid-cols-1 gap-2 pt-1"
              >
                <div
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reportType === 'names_only'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setReportType('names_only')}
                >
                  <RadioGroupItem value="names_only" id="names_only" className="mt-1" />
                  <div className="space-y-1">
                    <Label
                      htmlFor="names_only"
                      className="font-medium cursor-pointer flex items-center gap-1.5"
                    >
                      <List className="h-4 w-4 text-primary" /> Apenas Nomes (Agrupados por Grupo)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Lista compacta com nome, tipo de serviço, telefone e status de privilégios.
                      Ideal para chamada rápida ou conferência.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reportType === 'full_details'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setReportType('full_details')}
                >
                  <RadioGroupItem value="full_details" id="full_details" className="mt-1" />
                  <div className="space-y-1">
                    <Label
                      htmlFor="full_details"
                      className="font-medium cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="h-4 w-4 text-primary" /> Informações Completas
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Relatório detalhado incluindo datas de nascimento/batismo, endereço,
                      esperança, gênero, designações e observações.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Preview Summary */}
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground flex justify-between items-center border">
              <span>Publicadores a imprimir:</span>
              <span className="font-bold text-foreground">{targetPublishers.length} registros</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINTABLE A4 CONTAINER (Hidden on screen, visible during window.print()) */}
      <div
        className="hidden print:block fixed inset-0 z-[9999] bg-white text-black p-0 m-0"
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <div className="w-full max-w-[210mm] mx-auto p-[10mm] text-black font-sans box-border text-[12px] leading-normal bg-white">
          {/* Header */}
          <div className="border-b-2 border-black pb-3 mb-4 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wider text-black">
              Lista de Publicadores da Congregação
            </h1>
            <div className="flex justify-between items-center text-xs mt-2 text-slate-700">
              <span>
                <strong>Escopo:</strong>{' '}
                {selectedGroup === 'all'
                  ? 'Todos os Grupos'
                  : `Grupo ${sortedGroups.find((g) => g.id === selectedGroup)?.number || ''}`}
              </span>
              <span>
                <strong>Tipo:</strong>{' '}
                {reportType === 'names_only' ? 'Apenas Nomes' : 'Informações Completas'}
              </span>
              <span>
                <strong>Total:</strong> {targetPublishers.length} publicador(es)
              </span>
              <span>
                <strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Grouped Content */}
          {groupsToDisplay.map((grp) => {
            const pubsInGroup = targetPublishers
              .filter((p) => p.group_id === grp.id)
              .sort((a, b) => a.name.localeCompare(b.name))

            if (pubsInGroup.length === 0 && selectedGroup !== 'all') {
              return (
                <div key={grp.id} className="py-4 text-center italic text-slate-500">
                  Nenhum publicador encontrado neste grupo.
                </div>
              )
            }

            if (pubsInGroup.length === 0) return null

            return (
              <div key={grp.id} className="mb-6 break-inside-avoid">
                {/* Group Banner Header */}
                <div className="bg-[#e2e8f0] border border-black px-3 py-1.5 flex justify-between items-center font-bold text-sm mb-2">
                  <span>GRUPO {grp.number}</span>
                  {grp.leader && (
                    <span className="text-xs font-normal">
                      Dirigente: <strong>{grp.leader}</strong>
                    </span>
                  )}
                  <span className="text-xs font-semibold bg-white border border-black/40 px-2 py-0.5 rounded">
                    {pubsInGroup.length} membro(s)
                  </span>
                </div>

                {/* NAMES ONLY VIEW (Compact Table) */}
                {reportType === 'names_only' ? (
                  <table className="w-full border-collapse border border-black text-left text-[11px] mb-2">
                    <thead>
                      <tr className="bg-[#f1f5f9] border-b border-black">
                        <th className="border border-black px-2 py-1 w-8 text-center">#</th>
                        <th className="border border-black px-2 py-1">Nome Completo</th>
                        <th className="border border-black px-2 py-1 w-32">Telefone</th>
                        <th className="border border-black px-2 py-1 w-32">Tipo de Serviço</th>
                        <th className="border border-black px-2 py-1 w-28">Privilégio</th>
                        <th className="border border-black px-2 py-1 w-24">Condição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pubsInGroup.map((pub, idx) => {
                        const privileges: string[] = []
                        if (pub.is_elder) privileges.push('Ancião')
                        if (pub.is_ministerial_servant) privileges.push('Servo Min.')
                        if (pub.is_special_pioneer) privileges.push('Pion. Especial')
                        if (pub.is_field_missionary) privileges.push('Missionário')

                        return (
                          <tr key={pub.id} className={idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'}>
                            <td className="border border-black px-2 py-1 text-center font-semibold">
                              {idx + 1}
                            </td>
                            <td className="border border-black px-2 py-1 font-medium">
                              {pub.name}
                            </td>
                            <td className="border border-black px-2 py-1">{pub.phone || '-'}</td>
                            <td className="border border-black px-2 py-1">
                              {formatTypeLabel(pub.type)}
                            </td>
                            <td className="border border-black px-2 py-1 text-[10px]">
                              {privileges.length > 0 ? privileges.join(', ') : '-'}
                            </td>
                            <td className="border border-black px-2 py-1 text-[10px]">
                              {!pub.baptism_date
                                ? 'Não Batizado'
                                : pub.status === 'Inativo (Apoio)'
                                  ? 'Inativo (Apoio)'
                                  : 'Batizado'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* FULL DETAILS VIEW (Card/Block per publisher) */
                  <div className="space-y-3">
                    {pubsInGroup.map((pub, idx) => {
                      const privileges: string[] = []
                      if (pub.is_elder) privileges.push('Ancião')
                      if (pub.is_ministerial_servant) privileges.push('Servo ministerial')
                      if (pub.is_special_pioneer) privileges.push('Pioneiro especial')
                      if (pub.is_field_missionary) privileges.push('Missionário em campo')

                      return (
                        <div
                          key={pub.id}
                          className="border border-black p-2 bg-white rounded-none break-inside-avoid text-[11px]"
                        >
                          <div className="flex justify-between items-center border-b border-black pb-1 mb-1.5 bg-[#f1f5f9] -mx-2 -mt-2 p-1.5">
                            <div className="font-bold text-[12px] flex items-center gap-2">
                              <span>{idx + 1}.</span>
                              <span>{pub.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-semibold">
                              <span className="border border-black bg-white px-1.5 py-0.5">
                                {formatTypeLabel(pub.type)}
                              </span>
                              {pub.status && pub.status !== 'Ativo' && (
                                <span className="border border-black bg-white px-1.5 py-0.5">
                                  {pub.status}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-1">
                            <div>
                              <span className="font-bold text-slate-700">Telefone: </span>
                              <span>{pub.phone || 'Não informado'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Sexo: </span>
                              <span>{pub.gender || 'Não informado'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Esperança: </span>
                              <span>{pub.hope || 'Outras ovelhas'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Nascimento: </span>
                              <span>{formatDate(pub.birth_date)}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Batismo: </span>
                              <span>
                                {pub.baptism_date ? formatDate(pub.baptism_date) : 'Não Batizado'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700">Privilégios: </span>
                              <span>
                                {privileges.length > 0 ? privileges.join(', ') : 'Nenhum'}
                              </span>
                            </div>
                            <div className="col-span-2 sm:col-span-3">
                              <span className="font-bold text-slate-700">Endereço: </span>
                              <span>{pub.address || 'Não informado'}</span>
                            </div>
                            {pub.notes && (
                              <div className="col-span-2 sm:col-span-3 border-t border-slate-300 pt-1 mt-1">
                                <span className="font-bold text-slate-700">Obs: </span>
                                <span className="italic">{pub.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Footer of Print */}
          <div className="mt-8 pt-3 border-t border-black flex justify-between text-[10px] text-slate-600">
            <span>Relatórios Congregação — Gestão de Publicadores</span>
            <span>Documento de uso interno</span>
          </div>
        </div>
      </div>
    </>
  )
}
