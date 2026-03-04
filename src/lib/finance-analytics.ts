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

export function getMonthlyAnalytics(data: any[]) {

  const months: any = {}

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