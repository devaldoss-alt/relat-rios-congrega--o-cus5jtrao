import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const chartConfig = {
  in_person: { label: 'Presencial', color: 'hsl(var(--primary))' },
  zoom: { label: 'Zoom', color: 'hsl(var(--chart-2))' },
}

export function EngagementAnalysis({ data }: { data: any }) {
  const chartData = useMemo(() => {
    if (!data) return []
    const { attendance } = data
    const map = new Map<string, { month: string; in_person: number; zoom: number; count: number }>()
    attendance.forEach((a: any) => {
      const month = a.meeting_date.substring(0, 7) // YYYY-MM
      const displayMonth = `${month.split('-')[1]}/${month.split('-')[0]}`

      if (!map.has(month)) map.set(month, { month: displayMonth, in_person: 0, zoom: 0, count: 0 })
      const val = map.get(month)!
      val.in_person += a.in_person || 0
      val.zoom += a.zoom || 0
      val.count += 1
    })

    return Array.from(map.values())
      .map((v) => ({
        month: v.month,
        in_person: Math.round(v.in_person / v.count),
        zoom: Math.round(v.zoom / v.count),
      }))
      .sort((a, b) => {
        const [mA, yA] = a.month.split('/')
        const [mB, yB] = b.month.split('/')
        return (
          new Date(Number(yA), Number(mA) - 1).getTime() -
          new Date(Number(yB), Number(mB) - 1).getTime()
        )
      })
  }, [data])

  if (!data) return null

  return (
    <Card className="mb-6 break-inside-avoid">
      <CardHeader>
        <CardTitle>Engajamento de Reuniões (Média Mensal)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar
              dataKey="in_person"
              stackId="a"
              fill="var(--color-in_person)"
              radius={[0, 0, 4, 4]}
            />
            <Bar dataKey="zoom" stackId="a" fill="var(--color-zoom)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
