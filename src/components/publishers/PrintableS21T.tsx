import { Publisher } from '@/services/publishers'
import { PublisherReport } from '@/services/publisher_reports'
import { Check } from 'lucide-react'

const SERVICE_MONTHS = [
  { month: '09', name: 'Setembro' },
  { month: '10', name: 'Outubro' },
  { month: '11', name: 'Novembro' },
  { month: '12', name: 'Dezembro' },
  { month: '01', name: 'Janeiro' },
  { month: '02', name: 'Fevereiro' },
  { month: '03', name: 'Março' },
  { month: '04', name: 'Abril' },
  { month: '05', name: 'Maio' },
  { month: '06', name: 'Junho' },
  { month: '07', name: 'Julho' },
  { month: '08', name: 'Agosto' },
]

interface Props {
  publisher: Publisher
  reports: PublisherReport[]
  serviceYear: number
}

export function PrintableS21T({ publisher, reports, serviceYear }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  const getReport = (month: string) => {
    const y = month >= '09' ? serviceYear - 1 : serviceYear
    return reports.find((r) => r.month === month && r.year === y)
  }

  let totalHours = 0
  let totalStudies = 0
  reports.forEach((r) => {
    totalHours += r.hours || 0
    totalStudies += r.bible_studies || 0
  })

  return (
    <div
      className="hidden print:flex fixed inset-0 z-[9999] bg-white justify-center items-start m-0 p-0"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      <div className="w-[190mm] min-h-[297mm] pt-[15mm] pb-[15mm] bg-white text-black font-sans text-[13px] box-border relative flex flex-col">
        <h1 className="text-center font-bold text-[16px] mb-4 text-[#1a365d]">
          REGISTRO DE PUBLICADOR DE CONGREGAÇÃO
        </h1>

        <div className="bg-[#e6ebf5] px-2 py-1 mb-1 flex items-center">
          <span className="font-bold mr-2 text-[12px]">Nome:</span>
          <span className="flex-1 border-b border-black">{publisher.name}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-6 bg-[#e6ebf5] px-2 py-1 mb-1">
          <div className="flex flex-col justify-center">
            <div className="flex items-center mb-1">
              <span className="font-bold mr-2 text-[12px]">Data de nascimento:</span>
              <span className="flex-1 border-b border-black inline-block h-4">
                {formatDate(publisher.birth_date)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-bold mr-2 text-[12px]">Data de batismo:</span>
              <span className="flex-1 border-b border-black inline-block h-4">
                {publisher.baptism_date
                  ? formatDate(publisher.baptism_date)
                  : 'Publicador Não Batizado'}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-1">
            <div className="flex items-center gap-4 text-[12px] font-bold">
              <label className="flex items-center gap-1">
                <div className="w-[14px] h-[14px] border border-black flex items-center justify-center bg-white">
                  {publisher.gender === 'Masculino' && (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  )}
                </div>
                Masculino
              </label>
              <label className="flex items-center gap-1">
                <div className="w-[14px] h-[14px] border border-black flex items-center justify-center bg-white">
                  {publisher.gender === 'Feminino' && <Check className="w-3 h-3" strokeWidth={3} />}
                </div>
                Feminino
              </label>
            </div>
            <div className="flex items-center gap-4 text-[12px] font-bold">
              <label className="flex items-center gap-1">
                <div className="w-[14px] h-[14px] border border-black flex items-center justify-center bg-white">
                  {publisher.hope === 'Outras ovelhas' && (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  )}
                </div>
                Outras ovelhas
              </label>
              <label className="flex items-center gap-1">
                <div className="w-[14px] h-[14px] border border-black flex items-center justify-center bg-white">
                  {publisher.hope === 'Ungido' && <Check className="w-3 h-3" strokeWidth={3} />}
                </div>
                Ungido
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between mb-4 mt-2 text-[12px] font-bold px-1">
          <label className="flex items-center gap-1">
            <div className="w-[14px] h-[14px] border border-black flex items-center justify-center">
              {publisher.is_elder && <Check className="w-3 h-3" strokeWidth={3} />}
            </div>
            Ancião
          </label>
          <label className="flex items-center gap-1">
            <div className="w-[14px] h-[14px] border border-black flex items-center justify-center">
              {publisher.is_ministerial_servant && <Check className="w-3 h-3" strokeWidth={3} />}
            </div>
            Servo ministerial
          </label>
          <label className="flex items-center gap-1">
            <div className="w-[14px] h-[14px] border border-black flex items-center justify-center">
              {publisher.type === 'pioneiro_regular' && (
                <Check className="w-3 h-3" strokeWidth={3} />
              )}
            </div>
            Pioneiro regular
          </label>
          <label className="flex items-center gap-1">
            <div className="w-[14px] h-[14px] border border-black flex items-center justify-center">
              {publisher.is_special_pioneer && <Check className="w-3 h-3" strokeWidth={3} />}
            </div>
            Pioneiro especial
          </label>
          <label className="flex items-center gap-1">
            <div className="w-[14px] h-[14px] border border-black flex items-center justify-center">
              {publisher.is_field_missionary && <Check className="w-3 h-3" strokeWidth={3} />}
            </div>
            Missionário em campo
          </label>
        </div>

        <table className="w-full border-collapse border border-black text-center text-[12px] table-fixed">
          <thead>
            <tr className="bg-[#e6ebf5]">
              <th className="border border-black p-1 font-bold w-[16%] leading-tight">
                Ano de serviço
                <br />
                <span className="text-[14px]">{serviceYear}</span>
              </th>
              <th className="border border-black p-1 font-bold w-[12%] leading-tight">
                Participou
                <br />
                no
                <br />
                ministério
              </th>
              <th className="border border-black p-1 font-bold w-[12%] leading-tight">
                Estudos
                <br />
                bíblicos
              </th>
              <th className="border border-black p-1 font-bold w-[12%] leading-tight">
                Pioneiro
                <br />
                auxiliar
              </th>
              <th className="border border-black p-1 font-bold w-[14%] leading-tight">
                Horas
                <br />
                <span className="font-normal text-[9px]">
                  (Se for pioneiro ou missionário em campo)
                </span>
              </th>
              <th className="border border-black p-1 font-bold w-[34%]">Observações</th>
            </tr>
          </thead>
          <tbody>
            {SERVICE_MONTHS.map(({ month, name }) => {
              const rep = getReport(month)
              const participated = rep?.participated || (rep?.hours && rep.hours > 0)
              const isAux = rep?.type === 'pioneiro_auxiliar'
              return (
                <tr key={month} className="h-[24px]">
                  <td className="border border-black p-1 text-left pl-2">{name}</td>
                  <td className="border border-black p-1 bg-[#e6ebf5]/30">
                    <div className="w-[16px] h-[16px] border border-blue-200/50 mx-auto flex items-center justify-center bg-[#f5f8fc]">
                      {participated && <Check className="w-3 h-3 text-blue-900" strokeWidth={3} />}
                    </div>
                  </td>
                  <td className="border border-black p-1 bg-[#e6ebf5]/30">
                    {rep?.bible_studies || ''}
                  </td>
                  <td className="border border-black p-1 bg-[#e6ebf5]/30">
                    <div className="w-[16px] h-[16px] border border-blue-200/50 mx-auto flex items-center justify-center bg-[#f5f8fc]">
                      {isAux && <Check className="w-3 h-3 text-blue-900" strokeWidth={3} />}
                    </div>
                  </td>
                  <td className="border border-black p-1 bg-[#e6ebf5]/30">{rep?.hours || ''}</td>
                  <td className="border border-black p-1 text-left px-2 bg-[#e6ebf5]/30 break-words">
                    {rep?.notes || ''}
                  </td>
                </tr>
              )
            })}
            <tr className="h-[24px]">
              <td colSpan={2} className="text-right font-bold pr-2 p-1 border-none bg-white">
                Total
              </td>
              <td className="border border-black p-1 bg-[#e6ebf5]/50 font-bold">
                {totalStudies || ''}
              </td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1 bg-[#e6ebf5]/50 font-bold">
                {totalHours || ''}
              </td>
              <td className="border border-black p-1"></td>
            </tr>
          </tbody>
        </table>

        <div className="mt-auto pt-8 text-[10px] text-gray-800 font-bold tracking-tight">
          S-21-T 11/23
        </div>
      </div>
    </div>
  )
}
