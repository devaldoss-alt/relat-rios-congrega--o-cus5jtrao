import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts'

export function PioneerPerformance({ data }: { data: any }) {
  const [focusedPioneer, setFocusedPioneer] = useState<string | null>(null)

  const { chartData, pioneers, chartConfig } = useMemo(() => {
    if (!data) return { chartData: [], pioneers: [], chartConfig: {} }
    const { periodReports, publishers } = data

    const regPioneers = publishers.filter((p: any) => p.type === 'pioneiro_regular')
    const pMap = new Map(regPioneers.map((p: any) => [p.id, p.name]))

    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ]
    const names = Array.from(new Set(regPioneers.map((p: any) => p.name)))
    const config: any = {}

    names.forEach((name, i) => {
      config[`pioneer_${i}`] = { label: name as string, color: colors[i % colors.length] }
    })

    const map = new Map<string, any>()
    periodReports.forEach((r: any) => {
      const pubId = r.publisher_id
      if (pMap.has(pubId) || r.expand?.publisher_id?.type === 'pioneiro_regular') {
        const key = `${r.month.padStart(2, '0')}/${r.year}`
        if (!map.has(key)) map.set(key, { month: key })

        const val = map.get(key)
        const name = pMap.get(pubId) || r.expand?.publisher_id?.name
        if (name) {
          const idx = names.indexOf(name)
          if (idx !== -1) val[`pioneer_${idx}`] = r.hours || 0
        }
      }
    })

    return {
      chartData: Array.from(map.values()).sort((a, b) => {
        const [mA, yA] = a.month.split('/')
        const [mB, yB] = b.month.split('/')
        return (
          new Date(Number(yA), Number(mA) - 1).getTime() -
          new Date(Number(yB), Number(mB) - 1).getTime()
        )
      }),
      pioneers: names.map((n, i) => ({ id: `pioneer_${i}`, name: n })),
      chartConfig: config,
    }
  }, [data])

  if (!data || pioneers.length === 0) return null

  const handleLegendClick = (e: any) => {
    if (focusedPioneer === e.dataKey) {
      setFocusedPioneer(null)
    } else {
      setFocusedPioneer(e.dataKey)
    }
  }

  return (
    <Card className="mb-6 break-inside-avoid">
      <CardHeader>
        <CardTitle>Desempenho dos Pioneiros</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
            <ReferenceLine
              y={50}
              stroke="hsl(var(--destructive))"
              strokeDasharray="3 3"
              label="Meta 50h"
            />
            {pioneers.map((p) => (
              <Line
                key={p.id}
                name={p.name as string}
                type="monotone"
                dataKey={p.id}
                stroke={
                  focusedPioneer && focusedPioneer !== p.id
                    ? 'hsl(var(--muted-foreground))'
                    : `var(--color-${p.id})`
                }
                strokeWidth={focusedPioneer === p.id ? 3 : 2}
                opacity={focusedPioneer && focusedPioneer !== p.id ? 0.3 : 1}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
