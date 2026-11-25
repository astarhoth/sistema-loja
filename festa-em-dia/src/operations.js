import { putRecord } from './data.js'

export function saveExpense(data, expense) {
  if (!expense.reason) throw new Error('Informe o motivo da saída.')
  if (!expense.date || !Number.isSafeInteger(expense.amount) || expense.amount <= 0) throw new Error('Informe a data e um valor maior que zero.')
  if (expense.employeeId && !data.employees.some((employee) => employee.id === expense.employeeId)) throw new Error('Selecione um funcionário cadastrado.')
  return putRecord(data, 'expenses', expense)
}

export function removeEmployee(data, collection, id) {
  if (data.expenses.some((expense) => expense.employeeId === id)) throw new Error('Este funcionário está vinculado a uma saída de caixa. Você pode inativar o cadastro.')
  return { ...data, [collection]: data[collection].filter((employee) => employee.id !== id) }
}
