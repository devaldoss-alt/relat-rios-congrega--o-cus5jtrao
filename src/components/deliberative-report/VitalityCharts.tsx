import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

const chartConfig = {
  hours: { label: 'Horas', color: 'hsl(var(--primary))' },
  studies: { label: 'Estudos', color: 'hsl(var(--chart-2))' },
}

export function VitalityCharts({ data }: { data: any }) {
  const chartData = useMemo(() => {
    if (!data) return []
    const { periodReports } = data
    const map = new Map<string, { month: string; hours: number; studies: number }>()

    periodReports.forEach((r: any) => {
      const key = `${r.month.padStart(2, '0')}/${r.year}`
      if (!map.has(key)) map.set(key, { month: key, hours: 0, studies: 0 })
      const val = map.get(key)!
      val.hours += r.hours || 0
      val.studies += r.bible_studies || 0
    })

    return Array.from(map.values()).sort((a, b) => {
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
    <div className="grid gap-4 md:grid-cols-2 mb-6 break-inside-avoid">
      <Card>
        <CardHeader>
          <CardTitle>Total de Horas Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total de Estudos Bíblicos Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="studies"
                stroke="var(--color-studies)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
