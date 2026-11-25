import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ContractPaper } from './contracts.jsx'
import { orderMessage, rentalDocument, setRentalTemplate, whatsAppNumber } from './contracts.js'
import { fullDate, money } from './data.js'
import { Badge, Icon } from './ui.jsx'

function ShareOrder({ order, phone }) {
  const message = orderMessage(order)
  const encoded = encodeURIComponent(message)
  const draftFits = encoded.length <= 6000
  const whatsapp = 'https://wa.me/' + phone + (draftFits ? '?text=' + encoded : '')
  const textarea = useRef(null)
  const [notice, setNotice] = useState('')

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setNotice('Mensagem copiada.')
    } catch {
      textarea.current.focus()
      textarea.current.select()
      setNotice('Use o comando de copiar no texto selecionado.')
    }
  }

  return <section className="card order-panel share-order" id="compartilhar-pedido">
    <h2>Compartilhar pedido</h2>
    <p className="muted">{phone ? 'WhatsApp do cliente · +' + phone : 'Cadastre um celular válido com DDD na ficha do cliente para abrir a conversa.'}</p>
    <label>Mensagem com o pedido e as condições do contrato
      <textarea ref={textarea} value={message} rows={6} readOnly />
    </label>
    {phone && !draftFits && <p className="muted">O texto é longo. Copie a mensagem e cole na conversa do cliente.</p>}
    <div className="row-actions">
      <button className="button secondary" onClick={copy}>Copiar mensagem</button>
      {phone && <a className="button primary" href={whatsapp} target="_blank" rel="noreferrer">Abrir WhatsApp</a>}
      {notice && <span role="status">{notice}</span>}
    </div>
  </section>
}

export function OrderPage({ data, rental, edit, save, backHref }) {
  const [showShare, setShowShare] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const document = rentalDocument(data, rental)
  const client = data.clients.find((entry) => entry.id === rental.clientId)
  const phone = whatsAppNumber(client?.phone)
  const archived = data.contracts.filter((contract) => contract.rentalId === rental.id)
  const selected = data.contractTemplates.some((entry) => entry.id === rental.contractTemplateId) ? rental.contractTemplateId : ''
  const defaultTemplate = data.contractTemplates.find((entry) => entry.id === data.defaultContractTemplateId)

  async function updateTemplate(id) {
    setError('')
    setPending(true)
    try {
      await save((current) => setRentalTemplate(current, rental.id, id))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setPending(false)
    }
  }

  return <>
    <a className="order-back" href={backHref}><Icon name="left" size={17} /> Locações</a>
    <header className="page-heading order-heading">
      <div>
        <div className="order-heading-meta"><span>Pedido #{rental.code}</span><Badge status={rental.status} /></div>
        <h1>{rental.name}</h1>
        <p>{client?.name}</p>
      </div>
      <div className="page-actions">
        <button className="button secondary" onClick={() => edit('rental', rental.id)}><Icon name="edit" size={17} /> Editar pedido</button>
        <button className="button secondary" onClick={() => window.print()}><Icon name="print" size={17} /> Imprimir pedido e contrato</button>
        <button className="button primary" aria-expanded={showShare} aria-controls={showShare ? 'compartilhar-pedido' : undefined} onClick={() => setShowShare(!showShare)}><Icon name="message" size={17} /> Enviar ao cliente</button>
      </div>
    </header>
    {showShare && <ShareOrder order={document} phone={phone} />}
    <div className="order-grid">
      <section className="card order-panel">
        <h2>Itens do pedido</h2>
        <div className="table-scroll"><table className="detail-table">
          <thead><tr><th>Item</th><th>Qtd.</th><th>Unitário</th><th>Subtotal</th></tr></thead>
          <tbody>{document.items.map((item) => <tr key={item.productId}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{money(item.quantity * item.price)}</td></tr>)}</tbody>
        </table></div>
        {rental.notes && <p className="detail-notes"><strong>Observações internas</strong>{rental.notes}</p>}
      </section>
      <section className="card order-panel">
        <h2>Datas e valores</h2>
        <dl className="detail-grid">
          <div><dt>Saída</dt><dd>{fullDate(rental.start)}</dd></div>
          <div><dt>Devolução</dt><dd>{fullDate(rental.end)}</dd></div>
          {rental.address && <div className="span-two"><dt>Entrega ou retirada</dt><dd>{rental.address}</dd></div>}
          {client?.phone && <div className="span-two"><dt>Celular do cliente</dt><dd>{client.phone}</dd></div>}
        </dl>
        <dl className="detail-totals order-totals">
          <div><dt>Taxa de entrega</dt><dd>{money(document.fee)}</dd></div>
          <div><dt>Total</dt><dd>{money(document.total)}</dd></div>
          <div><dt>Recebido</dt><dd>{money(document.paid)}</dd></div>
          <div><dt>Saldo</dt><dd>{money(document.total - document.paid)}</dd></div>
        </dl>
      </section>
    </div>
    <section className="card order-panel order-contract">
      <div className="section-head"><h2>Contrato do pedido</h2><a className="button secondary small" href="#contratos">Gerenciar modelos</a></div>
      <label>Modelo de contrato
        <select value={selected} disabled={pending} onChange={(event) => updateTemplate(event.target.value)}>
          <option value="">Usar padrão · {defaultTemplate.name}</option>
          {data.contractTemplates.filter((template) => template.id !== defaultTemplate.id || selected === template.id).map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}
        </select>
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!data.company.name && <p className="muted">Preencha os <a className="text-link" href="#empresa">dados da empresa</a> para identificar a locadora no contrato.</p>}
      <details className="contract-preview">
        <summary>Ver contrato do pedido</summary>
        <ContractPaper contract={document} />
      </details>
      {archived.length > 0 && <div className="linked-contracts"><h3>Contratos anteriores</h3>{archived.map((contract) =>
        <button className="button secondary small" key={contract.id} onClick={() => edit('contract', contract.id)}>{contract.code}</button>)}</div>}
    </section>
    {createPortal(<div className="contract-print order-print"><ContractPaper contract={document} /></div>, window.document.body)}
  </>
}
