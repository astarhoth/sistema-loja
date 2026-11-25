import React, { useState } from 'react'
import { availableStock, categoryTree, dateKey, money, putRecord, putRental, removeRecord, shiftDate, statuses, totalFor } from './data.js'
import { PhotoField } from './photo-fields.jsx'
import { removePhotoRecord, savePhotoRecord } from './photos.js'
import { Dialog, Empty, Icon } from './ui.jsx'

const cents = (value) => Math.round(Number(value) * 100)
const amount = (value) => (value / 100).toFixed(2)
const valuesOf = (event) => Object.fromEntries(new FormData(event.currentTarget))

export function RecordForm({ type, record, categories, save, onClose, onSaved }) {
  const item = type === 'products'
  const label = item ? 'item' : 'cliente'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function commit(operation, message) {
    setBusy(true)
    setError('')
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
    const fields = Object.fromEntries(form)
    const name = fields.name.trim()
    if (!name) { setError('Informe um nome.'); return }
    const base = { id: record?.id ?? crypto.randomUUID(), name, notes: fields.notes.trim() }
    const entry = item
      ? { ...base, categoryId: fields.categoryId, stock: Number(fields.stock), price: cents(fields.price), dimensions: fields.dimensions.trim(),
          color: fields.color.trim(), description: fields.description.trim() }
      : {
          ...base, email: fields.email.trim(), phone: fields.phone.trim(), cpf: fields.cpf.trim(), rg: fields.rg.trim(), birthDate: fields.birthDate,
          postalCode: fields.postalCode.trim(), street: fields.street.trim(), addressNumber: fields.addressNumber.trim(),
          complement: fields.complement.trim(), neighborhood: fields.neighborhood.trim(), city: fields.city.trim(), state: fields.state.trim().toUpperCase(),
        }
    const operation = item
      ? () => savePhotoRecord(save, type, entry, form, putRecord)
      : () => save((data) => putRecord(data, type, entry))
    commit(operation, item ? 'Item salvo no acervo.' : 'Cliente salvo.')
  }

  return (
    <Dialog title={record ? 'Editar ' + label : item ? 'Novo item' : 'Novo cliente'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="dialog-body form-grid">
          <label className="span-two">{item ? 'Nome' : 'Nome completo'}<input name="name" defaultValue={record?.name} required maxLength={100} /></label>
          {item ? <>
            <PhotoField record={record} icon="box" />
            <label className="span-two">Categoria<select name="categoryId" defaultValue={record?.categoryId ?? ''}><option value="">Sem categoria</option>{categoryTree(categories).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
            <label>Quantidade em estoque<input name="stock" type="number" min="0" max="100000" step="1" defaultValue={record?.stock ?? 1} required /></label>
            <label>Valor por unidade (R$)<input name="price" type="number" min="0" max="1000000" step="0.01" defaultValue={amount(record?.price ?? 0)} required /></label>
            <label>Medidas<input name="dimensions" defaultValue={record?.dimensions} placeholder="Ex. 80 × 60 × 45 cm" maxLength={100} /></label>
            <label>Cor<input name="color" defaultValue={record?.color} maxLength={80} /></label>
            <label className="span-two">Descrição<textarea name="description" rows={2} defaultValue={record?.description} maxLength={800} /></label>
          </> : <>
            <label>CPF<input name="cpf" inputMode="numeric" placeholder="000.000.000-00" defaultValue={record?.cpf} maxLength={14} /></label>
            <label>RG<input name="rg" defaultValue={record?.rg} maxLength={30} /></label>
            <label>Data de nascimento<input name="birthDate" type="date" max={dateKey()} defaultValue={record?.birthDate} /></label>
            <label>Celular<input name="phone" type="tel" defaultValue={record?.phone} maxLength={40} /></label>
            <label>E-mail<input name="email" type="email" defaultValue={record?.email} maxLength={100} /></label>
            <h3 className="form-subheading span-two">Endereço do cliente</h3>
            <label>CEP<input name="postalCode" inputMode="numeric" placeholder="00000-000" pattern="[0-9]{5}-?[0-9]{3}" title="Digite os oito dígitos do CEP." defaultValue={record?.postalCode} maxLength={9} /></label>
            <label>Rua / Avenida<input name="street" defaultValue={record?.street} maxLength={120} /></label>
            <label>Número<input name="addressNumber" defaultValue={record?.addressNumber} maxLength={15} /></label>
            <label>Complemento<input name="complement" defaultValue={record?.complement} maxLength={80} /></label>
            <label>Bairro<input name="neighborhood" defaultValue={record?.neighborhood} maxLength={80} /></label>
            <label>Cidade<input name="city" defaultValue={record?.city} maxLength={80} /></label>
            <label>UF<input name="state" pattern="[A-Za-z]{2}" title="Use a sigla do estado com duas letras." placeholder="Ex. PE" defaultValue={record?.state} maxLength={2} /></label>
          </>}
          <label className="span-two">Observações<textarea name="notes" rows={3} defaultValue={record?.notes} maxLength={500} /></label>
          {error && <div className="form-error span-two" role="alert">{error}</div>}
          {removing && <div className="form-error span-two">Remover {record.name}? Essa ação é definitiva.</div>}
        </div>
        <footer className="dialog-footer">
          {record && (removing
            ? <button className="button danger push" disabled={busy} type="button" onClick={() => commit(
              item ? () => removePhotoRecord(save, type, record.id, removeRecord) : () => save((data) => removeRecord(data, type, record.id)),
              'Cadastro removido.',
            )}>Confirmar remoção</button>
            : <button className="button text-danger push" type="button" onClick={() => setRemoving(true)}><Icon name="trash" size={17} /> Remover</button>)}
          <button className="button secondary" type="button" onClick={onClose}>Cancelar</button>
          <button className="button primary" disabled={busy || removing}>Salvar</button>
        </footer>
      </form>
    </Dialog>
  )
}

export function RentalForm({ data, rental, save, onClose, onSaved, openRecord }) {
  const today = dateKey()
  const [start, setStart] = useState(rental?.start ?? today)
  const [end, setEnd] = useState(rental?.end ?? dateKey(shiftDate(new Date(), 1)))
  const [items, setItems] = useState(rental?.items.map((item) => ({ ...item, price: amount(item.price) })) ?? [])
  const [fee, setFee] = useState(amount(rental?.fee ?? 0))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const nextProduct = data.products.find((product) => !items.some((item) => item.productId === product.id))
  const total = totalFor({ fee: cents(fee), items: items.map((item) => ({ ...item, price: cents(item.price) })) })

  function changeItem(index, fields) {
    setItems((current) => current.map((item, at) => at === index ? { ...item, ...fields } : item))
  }

  async function submit(event) {
    event.preventDefault()
    const fields = valuesOf(event)
    if (!fields.name.trim()) { setError('Informe o nome do evento.'); return }
    setBusy(true)
    setError('')
    const id = rental?.id ?? crypto.randomUUID()
    try {
      await save((current) => putRental(current, {
        id, name: fields.name.trim(), clientId: fields.clientId, status: fields.status,
        start, end, items: items.map((item) => ({ ...item, quantity: Number(item.quantity), price: cents(item.price) })),
        fee: cents(fee), paid: cents(fields.paid), address: fields.address.trim(), notes: fields.notes.trim(),
      }))
      onSaved(rental ? 'Locação atualizada.' : 'Locação criada.', id)
    } catch (failure) {
      setError(failure.message)
      setBusy(false)
    }
  }

  return <Dialog title={rental ? 'Editar locação #' + rental.code : 'Nova locação'} onClose={onClose} wide>
    {(!data.clients.length || !data.products.length) ? <>
      <Empty icon="clipboard" title="Prepare os cadastros" description="Cadastre pelo menos um cliente e um item do acervo para criar uma locação." />
      <footer className="dialog-footer">
        {!data.clients.length && <button className="button secondary" onClick={() => openRecord('clients')}>Cadastrar cliente</button>}
        {!data.products.length && <button className="button primary" onClick={() => openRecord('products')}>Cadastrar item</button>}
      </footer>
    </> : <form onSubmit={submit}>
      <div className="dialog-body">
        <div className="form-grid">
          <label className="span-two">Nome do evento<input name="name" defaultValue={rental?.name} required maxLength={100} placeholder="Ex. Aniversário da Helena" /></label>
          <label>Cliente<select name="clientId" defaultValue={rental?.clientId ?? ''} required><option value="" disabled>Selecione o cliente</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label>Status<select name="status" defaultValue={rental?.status ?? 'quote'}>{Object.entries(statuses).map(([value, status]) => <option value={value} key={value}>{status.label}</option>)}</select></label>
          <label>Data de saída<input type="date" value={start} onChange={(event) => { const date = event.target.value; setStart(date); if (date > end) setEnd(date) }} required /></label>
          <label>Data de devolução<input type="date" min={start} value={end} onChange={(event) => setEnd(event.target.value)} required /></label>
          <label className="span-two">Endereço ou retirada<input name="address" defaultValue={rental?.address} maxLength={200} placeholder="Ex. Retirada na loja" /></label>
        </div>
        <section className="form-section">
          <div className="section-head"><h3>Itens da locação</h3><button className="button secondary small" type="button" disabled={!nextProduct} onClick={() => setItems([...items, { productId: nextProduct.id, quantity: 1, price: amount(nextProduct.price) }])}><Icon name="plus" size={16} /> Adicionar item</button></div>
          {!items.length && <p className="muted line-hint">Adicione os itens que o cliente deseja locar.</p>}
          {items.map((item, index) => {
            const product = data.products.find((entry) => entry.id === item.productId)
            const available = product && start && end && start <= end ? availableStock(product, data.rentals, start, end, rental?.id) : null
            return <div className="item-line" key={index}>
              <label>Item<select value={item.productId} onChange={(event) => {
                const selected = data.products.find((entry) => entry.id === event.target.value)
                changeItem(index, { productId: selected.id, price: amount(selected.price) })
              }}>{data.products.filter((entry) => entry.id === item.productId || !items.some((line) => line.productId === entry.id)).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select>
              {available !== null && <small className={Number(item.quantity) > available ? 'text-danger' : 'muted'}>{available} un. disponíveis no período</small>}</label>
              <label>Qtd.<input aria-label={'Quantidade do item ' + (index + 1)} type="number" min="1" max="100000" step="1" value={item.quantity} onChange={(event) => changeItem(index, { quantity: event.target.value })} required /></label>
              <label>Unitário (R$)<input type="number" min="0" max="1000000" step="0.01" value={item.price} onChange={(event) => changeItem(index, { price: event.target.value })} required /></label>
              <button className="icon-button remove-line" type="button" aria-label={'Remover item ' + (index + 1)} onClick={() => setItems(items.filter((_, at) => at !== index))}><Icon name="trash" size={18} /></button>
            </div>
          })}
        </section>
        <div className="form-grid">
          <label>Taxa de entrega (R$)<input type="number" min="0" max="1000000" step="0.01" value={fee} onChange={(event) => setFee(event.target.value)} required /></label>
          <label>Valor recebido (R$)<input name="paid" type="number" min="0" max={amount(total)} step="0.01" defaultValue={amount(rental?.paid ?? 0)} required /></label>
          <label className="span-two">Observações<textarea name="notes" rows={2} defaultValue={rental?.notes} maxLength={1000} /></label>
          {error && <div className="form-error span-two" role="alert">{error}</div>}
        </div>
      </div>
      <footer className="dialog-footer">
        <div className="push total-label"><span>Total</span><strong>{money(total)}</strong></div>
        <button className="button secondary" type="button" onClick={onClose}>Fechar</button>
        <button className="button primary" disabled={busy}>Salvar locação</button>
      </footer>
    </form>}
  </Dialog>
}

