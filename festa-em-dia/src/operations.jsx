import React, { useState } from 'react'
import { dateKey, findName, fullDate, money, normalize, putRecord } from './data.js'
import { saveExpense, removeEmployee } from './operations.js'
import { Photo, PhotoField } from './photo-fields.jsx'
import { removePhotoRecord, savePhotoRecord } from './photos.js'
import { Dialog, Empty, Icon, Search } from './ui.jsx'

const trimmedFields = (form) => Object.fromEntries([...form].filter(([, value]) => typeof value === 'string').map(([name, value]) => [name, value.trim()]))

export function Company({ company, save, onSaved }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const fields = trimmedFields(new FormData(event.currentTarget))
    if (!fields.name) { setError('Informe o nome ou a razão social da locadora.'); return }
    setError('')
    setBusy(true)
    try {
      await save((data) => ({ ...data, company: fields }))
      onSaved('Dados da empresa salvos.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="card company-card">
    <form onSubmit={submit}>
      <div className="dialog-body form-grid">
        <label className="span-two">Nome ou razão social<input name="name" defaultValue={company.name} maxLength={120} required /></label>
        <label>CPF ou CNPJ<input name="document" defaultValue={company.document} maxLength={25} /></label>
        <label>Nome fantasia<input name="tradeName" defaultValue={company.tradeName} maxLength={120} /></label>
        <label>Telefone<input name="phone" type="tel" defaultValue={company.phone} maxLength={40} /></label>
        <label>E-mail<input name="email" type="email" defaultValue={company.email} maxLength={100} /></label>
        <label className="span-two">Endereço completo<input name="address" defaultValue={company.address} maxLength={240} /></label>
        {error && <p className="span-two form-error" role="alert">{error}</p>}
      </div>
      <footer className="dialog-footer"><button className="button primary" disabled={busy}>Salvar dados da empresa</button></footer>
    </form>
  </section>
}

export function Employees({ data, edit }) {
  const [query, setQuery] = useState('')
  const records = data.employees.filter((employee) =>
    normalize([employee.name, employee.role, employee.phone, employee.email].join(' ')).includes(normalize(query.trim())))
  return <section className="card">
    <div className="toolbar"><Search value={query} onChange={setQuery} placeholder="Buscar funcionário ou função" /></div>
    {records.length ? <div className="table-scroll"><table>
      <thead><tr><th>Funcionário</th><th>Função</th><th>Celular</th><th>Situação</th></tr></thead>
      <tbody>{records.map((employee) => <tr key={employee.id}>
        <td><div className="table-identity"><Photo id={employee.photoId} icon="users" /><button className="name-button" onClick={() => edit('employee', employee.id)}>{employee.name}</button></div></td>
        <td>{employee.role || '—'}</td><td>{employee.phone || '—'}</td>
        <td><span className={'badge ' + (employee.active ? 'green' : 'slate')}>{employee.active ? 'Ativo' : 'Inativo'}</span></td>
      </tr>)}</tbody>
    </table></div> : <Empty icon="users" title="Nenhum funcionário encontrado" description="Cadastre funcionários para vinculá-los às saídas de caixa." />}
  </section>
}

export function EmployeeForm({ employee, save, onClose, onSaved }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function commit(operation, message) {
    setError('')
    setBusy(true)
    try {
      await operation()
      onSaved(message)
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const { name, role, phone, email, hiredAt, notes } = trimmedFields(form)
    if (!name) { setError('Informe o nome do funcionário.'); return }
    commit(() => savePhotoRecord(save, 'employees', {
      id: employee?.id ?? crypto.randomUUID(), name, role, phone, email, hiredAt, notes, active: form.get('active') === 'yes',
    }, form, putRecord), 'Funcionário salvo.')
  }

  return <Dialog title={employee ? 'Editar funcionário' : 'Novo funcionário'} onClose={onClose} wide>
    <form onSubmit={submit}>
      <div className="dialog-body form-grid">
        <PhotoField record={employee} icon="users" />
        <label className="span-two">Nome completo<input name="name" defaultValue={employee?.name} maxLength={120} required /></label>
        <label>Função<input name="role" defaultValue={employee?.role} maxLength={100} /></label>
        <label>Data de admissão<input name="hiredAt" type="date" defaultValue={employee?.hiredAt} /></label>
        <label>Celular<input name="phone" type="tel" defaultValue={employee?.phone} maxLength={40} /></label>
        <label>E-mail<input name="email" type="email" defaultValue={employee?.email} maxLength={100} /></label>
        <label>Situação<select name="active" defaultValue={employee?.active === false ? 'no' : 'yes'}><option value="yes">Ativo</option><option value="no">Inativo</option></select></label>
        <label className="span-two">Observações<textarea name="notes" defaultValue={employee?.notes} rows={2} maxLength={500} /></label>
        {error && <p className="span-two form-error" role="alert">{error}</p>}
        {removing && <p className="span-two form-error">Remover o cadastro de {employee.name}?</p>}
      </div>
      <footer className="dialog-footer">
        {employee && (removing
          ? <button type="button" className="button danger push" disabled={busy} onClick={() => commit(() => removePhotoRecord(save, 'employees', employee.id, removeEmployee), 'Funcionário removido.')}>Confirmar remoção</button>
          : <button type="button" className="button text-danger push" onClick={() => setRemoving(true)}><Icon name="trash" size={17} /> Remover</button>)}
        <button type="button" className="button secondary" onClick={removing ? () => { setRemoving(false); setError('') } : onClose}>Cancelar</button>
        <button className="button primary" disabled={busy || removing}>Salvar funcionário</button>
      </footer>
    </form>
  </Dialog>
}

export function Expenses({ data, edit }) {
  const [query, setQuery] = useState('')
  const expenses = [...data.expenses].sort((left, right) => right.date.localeCompare(left.date)).filter((expense) =>
    normalize([expense.reason, findName(data.employees, expense.employeeId)].join(' ')).includes(normalize(query.trim())))
  return <>
    <div className="toolbar"><Search value={query} onChange={setQuery} placeholder="Buscar motivo ou funcionário" /></div>
    {expenses.length ? <div className="table-scroll"><table>
      <thead><tr><th>Motivo</th><th>Data</th><th>Funcionário</th><th className="number">Valor</th></tr></thead>
      <tbody>{expenses.map((expense) => <tr key={expense.id}>
        <td><button className="name-button" onClick={() => edit('expense', expense.id)}>{expense.reason}</button></td>
        <td className="nowrap">{fullDate(expense.date)}</td>
        <td>{expense.employeeId ? findName(data.employees, expense.employeeId) : '—'}</td>
        <td className="number nowrap">{money(expense.amount)}</td>
      </tr>)}</tbody>
    </table></div> : <Empty icon="wallet" title="Nenhuma saída de caixa encontrada" description="Use Nova saída para registrar uma despesa." />}
  </>
}

export function ExpenseForm({ expense, data, save, onSaved, onClose }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function commit(change, message) {
    setError('')
    setBusy(true)
    try {
      await save(change)
      onSaved(message)
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }

  function submit(event) {
    event.preventDefault()
    const fields = trimmedFields(new FormData(event.currentTarget))
    commit((current) => saveExpense(current, { ...fields, id: expense?.id ?? crypto.randomUUID(), amount: Math.round(Number(fields.amount) * 100) }), 'Saída de caixa salva.')
  }

  return <Dialog title={expense ? 'Editar saída de caixa' : 'Nova saída de caixa'} onClose={onClose}>
    <form onSubmit={submit}>
      <div className="dialog-body form-grid">
        <label>Data<input name="date" type="date" defaultValue={expense?.date ?? dateKey()} required /></label>
        <label>Valor (R$)<input name="amount" type="number" min="0.01" max="100000000" step="0.01" defaultValue={expense ? (expense.amount / 100).toFixed(2) : ''} required /></label>
        <label className="span-two">Motivo da saída<textarea name="reason" rows={3} maxLength={500} defaultValue={expense?.reason} required /></label>
        <label className="span-two">Funcionário vinculado<select name="employeeId" defaultValue={expense?.employeeId ?? ''}>
          <option value="">Sem vínculo com funcionário</option>
          {data.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{employee.active ? '' : ' (inativo)'}</option>)}
        </select></label>
        {error && <p className="span-two form-error" role="alert">{error}</p>}
        {removing && <p className="span-two form-error">Remover esta saída de caixa?</p>}
      </div>
      <footer className="dialog-footer">
        {expense && (removing
          ? <button type="button" className="button danger push" disabled={busy} onClick={() => commit((current) => ({ ...current, expenses: current.expenses.filter((entry) => entry.id !== expense.id) }), 'Saída de caixa removida.')}>Confirmar remoção</button>
          : <button type="button" className="button text-danger push" onClick={() => setRemoving(true)}><Icon name="trash" size={17} /> Remover</button>)}
        <button type="button" className="button secondary" onClick={removing ? () => setRemoving(false) : onClose}>Cancelar</button>
        <button className="button primary" disabled={busy || removing}>Salvar saída</button>
      </footer>
    </form>
  </Dialog>
}
