export type ChartData = {
  month: string
  income: number
  expense: number
}

export function calculateBalance(data: any[]) {

  const income = data
    .filter((t) => t.type === "Credit")
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = data
    .filter((t) => t.type === "Debit")
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    income,
    expense,
    balance: income - expense,
  }
}

export function getMonthlyAnalytics(data: any[]): ChartData[] {

  const months: Record<string, ChartData> = {}

  data.forEach((t) => {

    const month = new Date(t.date).toLocaleString("default", {
      month: "short",
    })

    if (!months[month]) {
      months[month] = {
        month,
        income: 0,
        expense: 0,
      }
    }

    if (t.type === "Credit") {
      months[month].income += t.amount
    } else {
      months[month].expense += t.amount
    }

  })

  return Object.values(months)
}
export type DailyChartData = {
  date: string
  income: number
  expense: number
}

export type BalancePoint = {
  date: string
  balance: number
}

export function getRunningBalance(data: any[]) {
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let balance = 0
  const balanceMap: Record<string, number> = {}

  sorted.forEach((t) => {
    if (t.type === "Credit") balance += t.amount
    else balance -= t.amount

    const date = new Date(t.date).toISOString().split("T")[0]
    balanceMap[date] = balance
  })

  const start = new Date(sorted[0].date)
  const end = new Date(sorted[sorted.length - 1].date)

  const result = []
  let runningBalance = 0

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0]

    if (balanceMap[key] !== undefined) {
      runningBalance = balanceMap[key]
    }

    result.push({
      date: key,
      balance: runningBalance,
    })
  }

  return result
}