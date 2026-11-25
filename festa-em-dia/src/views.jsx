import React, { useState } from 'react'
import { agendaEntries, availableStock, categoryTree, dateKey, dateLabel, digits, findName, initials, isCurrentReservation, money, normalize, shiftDate, statuses, totalFor } from './data.js'
import { Expenses } from './operations.jsx'
import { Photo } from './photo-fields.jsx'
import { Badge, Empty, Icon, Search, Stat } from './ui.jsx'

const today = () => dateKey()
const rentalOrder = (left, right) => right.code - left.code
const match = (query, ...entries) => normalize(entries.join(' ')).includes(normalize(query.trim()))
const activeRentals = (rentals) => rentals.filter((rental) => ['reserved', 'out', 'returned'].includes(rental.status))
const sumsFor = (rentals) => rentals.reduce((sums, rental) => {
  const total = totalFor(rental)
  return { total: sums.total + total, paid: sums.paid + rental.paid, due: sums.due + total - rental.paid }
}, { total: 0, paid: 0, due: 0 })

export function RentalTable({ rentals, clients, open, compact = false }) {
  if (!rentals.length) return <Empty icon="clipboard" title="Nenhuma locação encontrada" description="Os pedidos que combinam com esta visualização aparecem aqui." />
  return <div className="table-scroll"><table className={'rental-table' + (compact ? ' compact-table' : '')}>
    <thead><tr><th>Código</th><th>Evento / Cliente</th><th>Saída</th>{!compact && <th>Devolução</th>}<th>Status</th><th className="number">Valor</th></tr></thead>
    <tbody>{rentals.map((rental, index) => {
      const client = findName(clients, rental.clientId)
      return <tr key={rental.id} onClick={() => open(rental.id)}>
        <td className="order-code">#{rental.code}</td>
        <td><div className="table-identity"><span className={'avatar tone-' + (index % 4)}>{initials(client)}</span><div>
          <button className="name-button" onClick={(event) => { event.stopPropagation(); open(rental.id) }}>{rental.name}</button>
          <small>{client}</small>
        </div></div></td>
        <td className="nowrap">{dateLabel(rental.start)}</td>
        {!compact && <td className="nowrap">{dateLabel(rental.end)}</td>}
        <td><Badge status={rental.status} /></td>
        <td className="number nowrap">{money(totalFor(rental))}</td>
      </tr>
    })}</tbody>
  </table></div>
}

function AgendaList({ entries, open }) {
  if (!entries.length) return <Empty icon="calendar" title="Agenda livre" description="As próximas saídas e devoluções aparecem aqui." />
  return <ul className="agenda-list">{entries.map(({ date, type, rental }) =>
    <li key={rental.id + type}>
      <button className="agenda-row" onClick={() => open(rental.id)}>
        <span className={'date-chip ' + (type === 'Saída' ? 'purple' : 'amber')}><strong>{date.slice(-2)}</strong><small>{dateLabel(date, { month: 'short' })}</small></span>
        <span className="agenda-info"><strong>{rental.name}</strong><small>{type === 'Saída' ? <Icon name="truck" size={14} /> : <Icon name="package" size={14} />}{type} · #{rental.code}</small></span>
        <Icon name="right" size={16} className="agenda-chevron" />
      </button>
    </li>
  )}</ul>
}

export function Dashboard({ data, go, open }) {
  const [movement, setMovement] = useState('')
  const day = today()
  const month = day.slice(0, 7)
  const next = agendaEntries(data.rentals).filter(({ date, type, rental }) =>
    date >= day && (rental.status === 'reserved' || (rental.status === 'out' && type === 'Devolução')))
  const monthSums = sumsFor(activeRentals(data.rentals).filter((rental) => rental.start.startsWith(month)))
  const reservations = data.rentals.filter((rental) => isCurrentReservation(rental, day)).length
  const quotes = data.rentals.filter((rental) => rental.status === 'quote').length
  const outgoing = data.rentals.filter((rental) => rental.status === 'out').length
  const overdue = data.rentals.filter((rental) => rental.status === 'out' && rental.end < day).length
  const recent = [...data.rentals].sort(rentalOrder).slice(0, 5)
  return <>
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-kicker"><Icon name="sparkle" size={15} /> SUA CENTRAL DE LOCAÇÕES</div>
        <h2>Festas em ordem.<br />Agenda em dia.</h2>
        <p>{next.length ? `Você tem ${next.length} ${next.length === 1 ? 'movimentação programada' : 'movimentações programadas'} no acervo.` : 'Consulte o calendário de saídas e devoluções do acervo.'}</p>
        <button className="button hero-button" onClick={() => go('agenda')}><Icon name="calendar" size={17} /> Ver agenda</button>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
        <Icon name="sparkle" className="art-sparkle sparkle-one" size={38} /><Icon name="sparkle" className="art-sparkle sparkle-two" size={24} />
        <span className="art-dot dot-one" /><span className="art-dot dot-two" /><span className="art-dot dot-three" />
        <div className="art-calendar">
          <i className="binding first" /><i className="binding second" />
          <div className="art-calendar-top" />
          <div className="art-days">{Array.from({ length: 12 }, (_, index) => <i key={index} className={index === 6 ? 'marked' : ''}>{index === 6 && <Icon name="check" size={18} />}</i>)}</div>
        </div>
        <div className="art-check"><Icon name="check" size={27} /></div>
      </div>
    </section>
    <section className="stats" aria-label="Resumo de locações">
      <Stat icon="calendar" color="purple" label="Reservas confirmadas" value={reservations} detail="Em andamento ou futuras" href="#locacoes?status=reserved&vigentes=1" />
      <Stat icon="clipboard" color="amber" label="Orçamentos abertos" value={quotes} detail="Aguardando confirmação" href="#locacoes?status=quote" />
      <Stat icon="package" color="blue" label="Locações em andamento" value={outgoing} detail={overdue ? `${overdue} com devolução atrasada` : 'Com itens fora do acervo'} href="#locacoes?status=out" />
      <Stat icon="wallet" color="green" label="Recebido nas saídas do mês" value={money(monthSums.paid)} detail="Valores registrados nessas locações" />
    </section>
    <div className="dashboard-grid">
      <section className="card dashboard-table">
        <header className="panel-heading"><div><h2>Locações recentes</h2><p>Últimos pedidos registrados</p></div><button className="button secondary small" onClick={() => go('locacoes')}>Ver todas</button></header>
        <RentalTable rentals={recent} clients={data.clients} open={open} compact />
      </section>
      <section className="card dashboard-agenda">
        <header className="panel-heading"><h2>Próximas movimentações</h2><span className="icon-tile purple"><Icon name="calendar" size={19} /></span></header>
        <div className="movement-filter">
          <div className="segmented" aria-label="Filtrar próximas movimentações">
            <button aria-pressed={!movement} onClick={() => setMovement('')}>Todas</button>
            <button aria-pressed={movement === 'Saída'} onClick={() => setMovement('Saída')}>Saídas</button>
            <button aria-pressed={movement === 'Devolução'} onClick={() => setMovement('Devolução')}>Devoluções</button>
          </div>
        </div>
        <AgendaList entries={next.filter((entry) => !movement || entry.type === movement).slice(0, 5)} open={open} />
      </section>
    </div>
  </>
}

export function Rentals({ data, open, filters }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(() => Object.hasOwn(statuses, filters.get('status')) ? filters.get('status') : '')
  const [currentOnly, setCurrentOnly] = useState(() => filters.get('vigentes') === '1')
  const rentals = [...data.rentals].sort(rentalOrder).filter((rental) =>
    (!status || status === rental.status) && (status !== 'reserved' || !currentOnly || isCurrentReservation(rental))
    && match(query, rental.name, '#' + rental.code, findName(data.clients, rental.clientId)))
  return <section className="card">
    <div className="toolbar"><Search value={query} onChange={setQuery} placeholder="Buscar evento, cliente ou número" />
      <div className="row-actions">
        {status === 'reserved' && <label className="checkbox-label"><input type="checkbox" checked={currentOnly} onChange={(event) => setCurrentOnly(event.target.checked)} /> Somente vigentes</label>}
        <select aria-label="Filtrar status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{Object.entries(statuses).map(([key, entry]) => <option key={key} value={key}>{entry.label}</option>)}</select>
      </div>
    </div>
    <RentalTable rentals={rentals} clients={data.clients} open={open} />
  </section>
}

export function Inventory({ data, edit }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const tree = categoryTree(data.categories)
  const categoriesById = new Map(tree.map((entry) => [entry.id, entry]))
  const selection = categoriesById.has(category) ? category : ''
  const products = data.products.filter((entry) => {
    const branch = categoriesById.get(entry.categoryId)
    return (!selection || branch?.path.some((node) => node.id === selection)) && match(query, entry.name, branch?.label, entry.color, entry.dimensions, entry.description)
  })
  return <section className="card">
    <div className="toolbar"><Search value={query} onChange={setQuery} placeholder="Buscar item no acervo" /><select aria-label="Filtrar categoria" value={selection} onChange={(event) => setCategory(event.target.value)}><option value="">Todas as categorias</option>{tree.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></div>
    <div className="availability-bar">
      <span><Icon name="calendar" size={19} /> Disponibilidade no período</span>
      <label>De<input type="date" value={start} onChange={(event) => { const date = event.target.value; setStart(date); if (date > end) setEnd(date) }} /></label>
      <label>Até<input type="date" value={end} min={start} onChange={(event) => setEnd(event.target.value)} /></label>
    </div>
    {!products.length ? <Empty title="Nenhum item encontrado" description="Cadastre um item ou ajuste os filtros." /> :
      <div className="table-scroll"><table>
        <thead><tr><th>Item</th><th>Categoria</th><th>Estoque</th><th>Disponíveis</th><th className="number">Valor unitário</th></tr></thead>
        <tbody>{products.map((product) => {
          const available = start && end && start <= end ? availableStock(product, data.rentals, start, end) : null
          return <tr key={product.id} className="clickable" onClick={() => edit('products', product.id)}>
            <td><div className="table-identity"><Photo id={product.photoId} /><div>
              <button className="name-button" onClick={(event) => { event.stopPropagation(); edit('products', product.id) }}>{product.name}</button>
              {(product.dimensions || product.color) && <small>{[product.dimensions, product.color].filter(Boolean).join(' · ')}</small>}
            </div></div></td>
            <td>{categoriesById.get(product.categoryId)?.label ?? 'Sem categoria'}</td><td>{product.stock} un.</td><td>{available === null ? '—' : <span className={'availability-tag ' + (available > 0 ? 'green' : 'red')}>{available} un.</span>}</td><td className="number nowrap">{money(product.price)}</td>
          </tr>
        })}</tbody>
      </table></div>}
  </section>
}

export function Clients({ data, edit }) {
  const [query, setQuery] = useState('')
  const clients = data.clients.filter((client) => match(query, client.name, client.email, client.phone, client.cpf, digits(client.cpf ?? '')))
  return <section className="card">
    <div className="toolbar"><Search value={query} onChange={setQuery} placeholder="Buscar nome, celular, CPF ou e-mail" /></div>
    {!clients.length ? <Empty icon="users" title="Nenhum cliente encontrado" description="Cadastre um cliente ou ajuste a busca." /> :
      <div className="table-scroll"><table>
        <thead><tr><th>Cliente</th><th>Celular</th><th>E-mail</th><th>Locações</th></tr></thead>
        <tbody>{clients.map((client, index) => <tr key={client.id} className="clickable" onClick={() => edit('clients', client.id)}>
          <td><div className="table-identity"><span className={'avatar tone-' + (index % 4)}>{initials(client.name)}</span><button className="name-button" onClick={(event) => { event.stopPropagation(); edit('clients', client.id) }}>{client.name}</button></div></td>
          <td>{client.phone || '—'}</td><td>{client.email || '—'}</td><td>{data.rentals.filter((rental) => rental.clientId === client.id).length}</td>
        </tr>)}</tbody>
      </table></div>}
  </section>
}

const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export function Calendar({ data, open }) {
  const [month, setMonth] = useState(() => new Date())
  const [type, setType] = useState('')
  const [view, setView] = useState('month')
  const monthKey = dateKey(month).slice(0, 7)
  const entries = agendaEntries(data.rentals).filter((entry) => !type || entry.type === type)
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12)
  const gridStart = shiftDate(first, -first.getDay())
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const weeks = Math.ceil((daysInMonth + first.getDay()) / 7)
  const entriesByDay = Object.groupBy(entries, (entry) => entry.date)
  function moveMonth(offset) { setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1, 12)) }
  return <section className="card calendar">
    <div className="toolbar calendar-toolbar">
      <div className="calendar-controls">
        <button className="icon-button outlined" aria-label="Mês anterior" onClick={() => moveMonth(-1)}><Icon name="left" size={18} /></button>
        <h2>{dateLabel(monthKey + '-01', { month: 'long', year: 'numeric' })}</h2>
        <button className="icon-button outlined" aria-label="Próximo mês" onClick={() => moveMonth(1)}><Icon name="right" size={18} /></button>
        <button className="button secondary small" onClick={() => setMonth(new Date())}>Hoje</button>
      </div>
      <div className="calendar-controls">
        <select aria-label="Filtrar movimentação" value={type} onChange={(event) => setType(event.target.value)}><option value="">Todas as movimentações</option><option value="Saída">Saídas</option><option value="Devolução">Devoluções</option></select>
        <div className="segmented"><button aria-pressed={view === 'month'} onClick={() => setView('month')}>Mês</button><button aria-pressed={view === 'list'} onClick={() => setView('list')}>Lista</button></div>
      </div>
    </div>
    {view === 'list' ? <AgendaList entries={entries.filter((entry) => entry.date.startsWith(monthKey))} open={open} /> :
      <div className="calendar-scroll"><div className="calendar-grid">
        {weekdayNames.map((name) => <div className="weekday" key={name}>{name}</div>)}
        {Array.from({ length: weeks * 7 }, (_, index) => dateKey(shiftDate(gridStart, index))).map((day) =>
          <div className={'calendar-day' + (day.startsWith(monthKey) ? '' : ' other-month')} key={day}>
            <span className={day === today() ? 'today' : ''}>{Number(day.slice(-2))}</span>
            {(entriesByDay[day] ?? []).map(({ rental, type: entryType }) => <button className={'calendar-event ' + (entryType === 'Saída' ? 'purple' : 'amber')} key={rental.id + entryType} title={entryType + ' · ' + rental.name} onClick={() => open(rental.id)}>{entryType} · {rental.name}</button>)}
          </div>
        )}
      </div></div>}
  </section>
}

export function Finance({ data, open, edit, tab }) {
  const [query, setQuery] = useState('')
  const [balance, setBalance] = useState('')
  const rentals = activeRentals(data.rentals).sort(rentalOrder)
  const sums = sumsFor(rentals)
  const expenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const visible = rentals.filter((rental) => match(query, rental.name, rental.code, findName(data.clients, rental.clientId))
    && (!balance || (balance === 'due' ? rental.paid < totalFor(rental) : rental.paid === totalFor(rental))))
  return <>
    <section className="stats financial-stats" aria-label="Resumo financeiro">
      <Stat icon="clipboard" color="purple" label="Valor das locações" value={money(sums.total)} detail="Confirmadas, em andamento e devolvidas" />
      <Stat icon="wallet" color="green" label="Valor recebido" value={money(sums.paid)} detail="Pagamentos registrados nas locações" />
      <Stat icon="clock" color="amber" label="Saldo a receber" value={money(sums.due)} detail="Valor das locações em aberto" />
      <Stat icon="wallet" color="red" label="Saídas de caixa" value={money(expenses)} detail="Despesas registradas" />
      <Stat icon="wallet" color="blue" label="Saldo de caixa" value={money(sums.paid - expenses)} detail="Recebimentos menos saídas" />
    </section>
    <section className="card">
      <div className="toolbar finance-toolbar">
        <div className="segmented" aria-label="Movimentações financeiras">
          <a href="#financeiro" aria-current={tab === 'rentals' ? 'page' : undefined}>Locações</a>
          <a href="#financeiro?aba=saidas" aria-current={tab === 'expenses' ? 'page' : undefined}>Saídas de caixa</a>
        </div>
      </div>
      {tab === 'expenses' ? <Expenses data={data} edit={edit} /> : <>
        <div className="toolbar"><Search value={query} onChange={setQuery} placeholder="Buscar evento ou cliente" /><select aria-label="Filtrar pagamento" value={balance} onChange={(event) => setBalance(event.target.value)}><option value="">Todos os pagamentos</option><option value="due">Com saldo a receber</option><option value="paid">Quitadas</option></select></div>
      {!visible.length ? <Empty icon="wallet" title="Nenhuma locação encontrada" description="Os valores das locações confirmadas aparecem aqui." /> :
        <div className="table-scroll"><table>
          <thead><tr><th>Evento / Cliente</th><th className="number">Total</th><th className="number">Recebido</th><th className="number">Saldo</th></tr></thead>
          <tbody>{visible.map((rental) => <tr key={rental.id} className="clickable" onClick={() => open(rental.id)}>
            <td><div className="table-identity"><span className="avatar tone-0"><Icon name="wallet" size={17} /></span><div><button className="name-button" onClick={(event) => { event.stopPropagation(); open(rental.id) }}>{rental.name}</button><small>{findName(data.clients, rental.clientId)}</small></div></div></td>
            <td className="number nowrap">{money(totalFor(rental))}</td><td className="number nowrap">{money(rental.paid)}</td><td className="number nowrap">{money(totalFor(rental) - rental.paid)}</td>
          </tr>)}</tbody>
        </table></div>}
      </>}
    </section>
  </>
}
