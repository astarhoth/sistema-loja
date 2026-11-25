import React, { useState } from 'react'
import { removeTemplate, saveTemplate, setDefaultTemplate } from './contracts.js'
import { dateKey, defaultContractTemplate, fullDate, money, putRecord, statuses } from './data.js'
import { Badge, Dialog, Icon } from './ui.jsx'

export function Contracts({ data, edit, save }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function makeDefault(id) {
    setError('')
    setPending(true)
    try {
      await save((current) => setDefaultTemplate(current, id))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setPending(false)
    }
  }

  return <section className="card">
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="table-scroll"><table>
      <thead><tr><th>Modelo</th><th>Aplicação</th><th>Ações</th></tr></thead>
      <tbody>{data.contractTemplates.map((template) => {
        const isDefault = template.id === data.defaultContractTemplateId
        return <tr key={template.id}>
          <td><button className="name-button" onClick={() => edit('template', template.id)}>{template.name}</button></td>
          <td>{isDefault ? <span className="badge green">Padrão dos pedidos</span> : <span className="muted">Seleção no pedido</span>}</td>
          <td><div className="row-actions">
            <button className="button secondary small" onClick={() => edit('template', template.id)}>Editar</button>
            {!isDefault && <button className="button secondary small" disabled={pending} onClick={() => makeDefault(template.id)}>Definir como padrão</button>}
          </div></td>
        </tr>
      })}</tbody>
    </table></div>
  </section>
}

export function TemplateForm({ template, isDefault, save, onClose, onSaved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(false)

  async function commit(change, message) {
    setBusy(true)
    setError('')
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
    const form = new FormData(event.currentTarget)
    const model = { ...template, id: template?.id ?? crypto.randomUUID(), name: form.get('name').trim(), terms: form.get('terms').trim() }
    commit((data) => saveTemplate(data, model, form.has('makeDefault')), 'Modelo salvo.')
  }

  return <Dialog title={template ? 'Editar modelo de contrato' : 'Novo modelo de contrato'} onClose={onClose} wide>
    <form onSubmit={submit}>
      <div className="dialog-body form-grid">
        <label className="span-two">Nome do modelo<input name="name" defaultValue={template?.name} maxLength={100} required /></label>
        <label className="span-two">Condições do contrato<textarea name="terms" rows={9} defaultValue={template?.terms ?? defaultContractTemplate.terms} maxLength={12000} required /></label>
        {isDefault ? <p className="muted span-two">Este é o modelo padrão dos pedidos.</p> :
          <label className="checkbox-label span-two"><input name="makeDefault" type="checkbox" /> Usar como padrão nos pedidos</label>}
        {error && <p className="form-error span-two" role="alert">{error}</p>}
        {removing && <p className="form-error span-two">Remover este modelo? Os pedidos que o utilizam passarão a usar o padrão.</p>}
      </div>
      <footer className="dialog-footer">
        {template && !isDefault && (removing
          ? <button className="button danger push" type="button" disabled={busy} onClick={() => commit((data) => removeTemplate(data, template.id), 'Modelo removido.')}>Confirmar remoção</button>
          : <button className="button text-danger push" type="button" onClick={() => setRemoving(true)}><Icon name="trash" size={17} /> Remover modelo</button>)}
        <button type="button" className="button secondary" onClick={removing ? () => setRemoving(false) : onClose}>Cancelar</button>
        <button className="button primary" disabled={busy || removing}>Salvar modelo</button>
      </footer>
    </form>
  </Dialog>
}

export function ContractPaper({ contract }) {
  const { client, template } = contract
  return <article className="contract-paper">
    <header className="contract-title">
      <h2>{contract.code ? 'Contrato de locação' : 'Pedido #' + contract.rentalCode}</h2>
      <p>{contract.code ? `${contract.code} · Pedido #${contract.rentalCode} · Emissão em ${fullDate(contract.issuedAt)}` : template.name + ' · ' + statuses[contract.status].label}</p>
    </header>
    <section className="contract-parties">
      <div><h3>Locador</h3><strong>{template.issuer}</strong>{template.document && <p>CPF/CNPJ {template.document}</p>}{template.address && <p>{template.address}</p>}</div>
      <div><h3>Locatário</h3><strong>{client.name}</strong>{client.cpf && <p>CPF {client.cpf}</p>}{client.rg && <p>RG {client.rg}</p>}{client.address && <p>{client.address}</p>}</div>
    </section>
    <section className="contract-event">
      <h3>{contract.event}</h3>
      <p>Saída em {fullDate(contract.start)} · Devolução em {fullDate(contract.end)}</p>
      {contract.delivery && <p>Entrega ou retirada em {contract.delivery}</p>}
    </section>
    <div className="table-scroll"><table className="detail-table">
      <thead><tr><th>Item</th><th>Qtd.</th><th>Unitário</th><th>Subtotal</th></tr></thead>
      <tbody>{contract.items.map((item) => <tr key={item.productId}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{money(item.quantity * item.price)}</td></tr>)}</tbody>
    </table></div>
    <dl className="detail-totals">
      <div><dt>Taxa de entrega</dt><dd>{money(contract.fee)}</dd></div>
      <div><dt>Total</dt><dd>{money(contract.total)}</dd></div>
      <div><dt>Recebido</dt><dd>{money(contract.paid)}</dd></div>
      <div><dt>Saldo</dt><dd>{money(contract.total - contract.paid)}</dd></div>
    </dl>
    <section className="contract-terms"><h3>Condições da locação</h3><p>{template.terms}</p></section>
    <section className="contract-signatures">
      <p>Local ______________________________________ &nbsp; Data ____ / ____ / ________</p>
      <div><strong>{template.issuer}</strong><span>Assinatura do locador</span></div>
      <div><strong>{client.name}</strong><span>Assinatura do locatário</span></div>
    </section>
  </article>
}

export function ContractDetail({ contract, save, onClose }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function toggleSigned() {
    setBusy(true)
    setError('')
    try {
      await save((data) => putRecord(data, 'contracts', { ...contract, signedAt: contract.signedAt ? '' : dateKey() }))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <>
    <Dialog title={contract.code} onClose={onClose} wide className="contract-dialog">
      <div className="dialog-body">
        <p className="contract-status"><span className={'badge ' + (contract.signedAt ? 'green' : 'amber')}>{contract.signedAt ? 'Assinatura registrada em ' + fullDate(contract.signedAt) : 'Aguardando assinatura'}</span></p>
        <ContractPaper contract={contract} />
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <footer className="dialog-footer">
        <button className="button secondary" onClick={toggleSigned} disabled={busy}>{contract.signedAt ? 'Desfazer registro' : 'Marcar como assinado'}</button>
        <button className="button primary" onClick={() => window.print()}><Icon name="print" size={17} /> Imprimir contrato</button>
      </footer>
    </Dialog>
    <div className="contract-print"><ContractPaper contract={contract} /></div>
  </>
}
