import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export function GroupPerformanceAnalytics({ data }: { data: any }) {
  const chartData = useMemo(() => {
    if (!data) return []
    const { publishers, periodReports, groups, allReports, endDate } = data

    const [eY, eM] = endDate.split('-').map(Number)
    const threshold = new Date(eY, eM - 6, 1)

    return groups
      .map((g: any) => {
        const gPubs = publishers.filter(
          (p: any) => p.group_id === g.id || p.expand?.group_id?.id === g.id,
        )
        const activePubs = gPubs.filter((p: any) => p.active)

        const gReps = periodReports.filter((r: any) => {
          const pub = publishers.find((p: any) => p.id === r.publisher_id)
          return pub && (pub.group_id === g.id || pub.expand?.group_id?.id === g.id)
        })

        const uniqueReporters = new Set(gReps.map((r: any) => r.publisher_id)).size
        const participationRate = activePubs.length
          ? Math.round((uniqueReporters / activePubs.length) * 100)
          : 0

        const totalHours = gReps.reduce((s: number, r: any) => s + (r.hours || 0), 0)
        const totalStudies = gReps.reduce((s: number, r: any) => s + (r.bible_studies || 0), 0)
        const avgHours = uniqueReporters ? Math.round(totalHours / uniqueReporters) : 0
        const avgStudies = uniqueReporters
          ? Math.round((totalStudies / uniqueReporters) * 10) / 10
          : 0

        let irregularCount = 0
        gPubs.forEach((p: any) => {
          const pReps = allReports.filter((r: any) => r.publisher_id === p.id)
          pReps.sort(
            (a: any, b: any) =>
              new Date(b.year, parseInt(b.month) - 1, 1).getTime() -
              new Date(a.year, parseInt(a.month) - 1, 1).getTime(),
          )
          const last = pReps[0]
          if (!p.active) {
            irregularCount++
          } else if (!last || new Date(last.year, parseInt(last.month) - 1, 1) < threshold) {
            irregularCount++
          }
        })

        const pioneers = gPubs.filter(
          (p: any) => p.type === 'pioneiro_regular' || p.type === 'pioneiro_auxiliar',
        ).length

        return {
          name: `G${g.number}`,
          participationRate,
          avgHours,
          avgStudies,
          irregularCount,
          pioneers,
        }
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }, [data])

  if (!data) return null

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6 break-inside-avoid">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taxa de Participação (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ rate: { label: 'Participação', color: 'hsl(var(--primary))' } }}
            className="h-[200px] w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="participationRate" fill="var(--color-rate)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produtividade Média (Horas)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ hours: { label: 'Horas Médias', color: 'hsl(var(--chart-2))' } }}
            className="h-[200px] w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avgHours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Índice de Irregularidade/Inatividade</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              irregular: { label: 'Irregulares/Inativos', color: 'hsl(var(--destructive))' },
            }}
            className="h-[200px] w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="irregularCount" fill="var(--color-irregular)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engajamento de Pioneiros</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ pioneers: { label: 'Pioneiros (Aux/Reg)', color: 'hsl(var(--chart-4))' } }}
            className="h-[200px] w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="pioneers" fill="var(--color-pioneers)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
