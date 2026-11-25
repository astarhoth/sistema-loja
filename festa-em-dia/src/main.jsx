import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { agendaEntries, clearExamples, dateKey, dateLabel, loadData, updateData, watchData } from './data.js'
import { downloadCalendar } from './calendar-export.js'
import { Categories, CategoryForm } from './categories.jsx'
import { Contracts, ContractDetail, TemplateForm } from './contracts.jsx'
import { RentalForm, RecordForm } from './forms.jsx'
import { Company, EmployeeForm, Employees, ExpenseForm } from './operations.jsx'
import { OrderPage } from './orders.jsx'
import { Calendar, Clients, Dashboard, Finance, Inventory, Rentals } from './views.jsx'
import { Dialog, Empty, Icon } from './ui.jsx'
import './styles.css'

const pages = {
  inicio: { title: 'Visão geral', icon: 'home', description: 'Acompanhe as reservas, o acervo e os próximos eventos.' },
  locacoes: { title: 'Locações', icon: 'clipboard', description: 'Acompanhe cada pedido do orçamento à devolução.' },
  agenda: { title: 'Agenda', icon: 'calendar', description: 'Planeje as saídas e devoluções do acervo.' },
  acervo: { title: 'Acervo', icon: 'box', description: 'Cadastre seus itens e consulte a disponibilidade por período.', action: ['Novo item', 'products'] },
  categorias: { title: 'Categorias', icon: 'filter', description: 'Organize o acervo em categorias e subcategorias.', action: ['Nova categoria', 'category'] },
  clientes: { title: 'Clientes', icon: 'users', description: 'Gerencie os dados cadastrais e de contato dos clientes.', action: ['Novo cliente', 'clients'] },
  contratos: { title: 'Contratos', icon: 'file', description: 'Defina o contrato padrão e gerencie os modelos usados nos pedidos.', action: ['Novo modelo', 'template'] },
  financeiro: { title: 'Financeiro', icon: 'wallet', description: 'Acompanhe os recebimentos, as saídas e o saldo de caixa.', action: ['Nova saída', 'expense'] },
  empresa: { title: 'Empresa', icon: 'building', description: 'Cadastre a locadora que aparece nos contratos dos pedidos.', action: null },
  funcionarios: { title: 'Funcionários', icon: 'users', description: 'Gerencie os cadastros da sua equipe.', action: ['Novo funcionário', 'employee'] },
}

function currentRoute() {
  const value = window.location.hash.slice(1)
  const [page, id, ...rest] = value.split('?')[0].split('/')
  return Object.hasOwn(pages, page) && (!id || page === 'locacoes') && !rest.length ? value : 'inicio'
}

function App() {
  const [route, setRoute] = useState(currentRoute)
  const [path, search] = route.split('?')
  const [page, orderId] = path.split('/')
  const filters = new URLSearchParams(search)
  const [data, setData] = useState(loadData)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [clearError, setClearError] = useState('')
  const [clearing, setClearing] = useState(false)
  const active = pages[page]
  const hasExamples = [data.rentals, data.products, data.clients].some((collection) => collection.some((entry) => entry.example))
  const order = data.rentals.find((rental) => rental.id === orderId)

  useEffect(() => watchData(setData), [])
  useEffect(() => {
    function followHash() {
      setRoute(currentRoute())
      setMobileNav(false)
      setModal(null)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', followHash)
    return () => window.removeEventListener('hashchange', followHash)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 4400)
    return () => window.clearTimeout(timeout)
  }, [toast])
  useEffect(() => {
    document.title = (order ? `Pedido #${order.code} · ${order.name}` : pages[page].title) + ' · Festa em Dia'
  }, [page, order])

  function go(next) { window.location.hash = next }
  function open(id) { go('locacoes/' + id + (page === 'locacoes' && search ? '?' + search : '')) }
  function edit(type, id, options) { setModal({ type, id, ...options }) }
  function close() { setModal(null) }
  function saved(message) { close(); setToast(message) }
  async function save(change) {
    const next = await updateData(change)
    setData(next)
    return next
  }
  async function removeExamples() {
    setClearError('')
    setClearing(true)
    try {
      await save(clearExamples)
      saved('Dados demonstrativos removidos.')
    } catch (failure) {
      setClearError(failure.message)
    } finally {
      setClearing(false)
    }
  }

  const selectedRental = data.rentals.find((rental) => rental.id === modal?.id)
  const pageAction = active.action === undefined ? ['Nova locação', 'rental'] : active.action
  const selectedContract = data.contracts.find((contract) => contract.id === modal?.id)

  return <div className="app-shell">
    {mobileNav && <button className="nav-overlay" aria-label="Fechar navegação" onClick={() => setMobileNav(false)} />}
    <aside className={'sidebar' + (mobileNav ? ' sidebar-open' : '')}>
      <a className="brand" href="#inicio" onClick={() => setMobileNav(false)}>
        <span className="brand-icon"><Icon name="sparkle" size={25} /></span>
        <span><strong>Festa em Dia<span>.</span></strong><small>Gestão de locações</small></span>
      </a>
      <nav aria-label="Menu principal">
        <span className="navigation-title">ÁREA DE TRABALHO</span>
        {Object.entries(pages).map(([key, entry]) => <a className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} href={'#' + key} key={key} onClick={() => setMobileNav(false)}>
          <Icon name={entry.icon} size={20} /><span>{entry.title}</span>
        </a>)}
      </nav>
      <div className="sidebar-foot">
        {hasExamples && <button className="demo-button" onClick={() => { setClearError(''); edit('examples') }}><Icon name="info" size={17} /><span>Dados de exemplo</span><Icon name="right" size={14} /></button>}
        <div className="workspace-label"><span className="workspace-icon"><Icon name="box" size={19} /></span><div><strong>{data.company.tradeName || data.company.name || 'Minha locadora'}</strong><small>Armazenamento local</small></div></div>
      </div>
    </aside>
    <div className="main-shell">
      <header className="topbar">
        <div className="breadcrumb">
          <button className="icon-button mobile-toggle" aria-label="Abrir navegação" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Icon name="menu" /></button>
          <span className="breadcrumb-root">Operação</span><Icon name="right" size={14} /><strong>{active.title}</strong>
          {order && <><Icon name="right" size={14} /><span>#{order.code}</span></>}
        </div>
        <span className="today-label"><Icon name="calendar" size={17} />{dateLabel(dateKey(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </header>
      <main className="content" id="conteudo">
        {orderId ? (order
          ? <OrderPage key={order.id} data={data} rental={order} save={save} edit={edit} backHref={'#locacoes' + (search ? '?' + search : '')} />
          : <section className="card"><Empty icon="clipboard" title="Pedido não encontrado" /><div className="toolbar"><a className="button secondary" href="#locacoes">Ver locações</a></div></section>) : <>
        <section className="page-heading">
          <div><h1>{active.title}</h1><p>{active.description}</p></div>
          <div className="page-actions">
            {page === 'agenda' && <button className="button secondary" onClick={() => edit('calendar-export')}><Icon name="download" size={17} /> Google Agenda</button>}
            {pageAction && <button className="button primary action" onClick={() => edit(pageAction[1])}><Icon name="plus" size={19} />{pageAction[0]}</button>}
          </div>
        </section>
        {page === 'inicio' && <Dashboard data={data} go={go} open={open} />}
        {page === 'locacoes' && <Rentals key={route} data={data} open={open} filters={filters} />}
        {page === 'agenda' && <Calendar data={data} open={open} />}
        {page === 'acervo' && <Inventory data={data} edit={edit} />}
        {page === 'categorias' && <Categories data={data} edit={edit} />}
        {page === 'clientes' && <Clients data={data} edit={edit} />}
        {page === 'contratos' && <Contracts data={data} edit={edit} save={save} />}
        {page === 'financeiro' && <Finance data={data} open={open} edit={edit} tab={filters.get('aba') === 'saidas' ? 'expenses' : 'rentals'} />}
        {page === 'empresa' && <Company company={data.company} save={save} onSaved={saved} />}
        {page === 'funcionarios' && <Employees data={data} edit={edit} />}
        </>}
      </main>
    </div>
    {modal?.type === 'rental' && <RentalForm data={data} rental={selectedRental} save={save} onClose={close} onSaved={(message, id) => { saved(message); open(id) }} openRecord={edit} />}
    {['products', 'clients'].includes(modal?.type) && <RecordForm key={modal.type + (modal.id ?? '')} type={modal.type} categories={data.categories} record={data[modal.type].find((entry) => entry.id === modal.id)} save={save} onClose={close} onSaved={saved} />}
    {modal?.type === 'category' && <CategoryForm data={data} record={data.categories.find((category) => category.id === modal.id)} parentId={modal.parentId} save={save} onSaved={saved} onClose={close} />}
    {modal?.type === 'template' && <TemplateForm template={data.contractTemplates.find((template) => template.id === modal.id)}
      isDefault={modal.id === data.defaultContractTemplateId} save={save} onClose={close} onSaved={saved} />}
    {modal?.type === 'contract' && selectedContract && <ContractDetail contract={selectedContract} save={save} onClose={close} />}
    {modal?.type === 'employee' && <EmployeeForm employee={data.employees.find((employee) => employee.id === modal.id)} save={save} onClose={close} onSaved={saved} />}
    {modal?.type === 'expense' && <ExpenseForm expense={data.expenses.find((expense) => expense.id === modal.id)} data={data} save={save} onClose={close}
      onSaved={(message) => { saved(message); go('financeiro?aba=saidas') }} />}
    {modal?.type === 'calendar-export' && <Dialog title="Google Agenda" onClose={close}>
      <div className="dialog-body calendar-export">
        <p>Exporte as saídas e devoluções registradas em um arquivo iCalendar (.ics).</p>
        <ol>
          <li><a href="https://support.google.com/calendar/answer/37095?hl=pt-BR" target="_blank" rel="noreferrer">Crie uma agenda</a> para a sua locadora no Google Agenda.</li>
          <li><a href="https://support.google.com/calendar/answer/37118?hl=pt-BR" target="_blank" rel="noreferrer">Importe o arquivo</a> e selecione a agenda da locadora.</li>
          <li><a href="https://support.google.com/calendar/answer/37082?hl=pt-BR" target="_blank" rel="noreferrer">Compartilhe a agenda</a> com sua equipe.</li>
        </ol>
        <p className="muted">A importação é pontual. Gerencie alterações e cancelamentos posteriores na agenda importada.</p>
      </div>
      <footer className="dialog-footer">
        <button className="button secondary" onClick={close}>Fechar</button>
        <button className="button primary" disabled={!agendaEntries(data.rentals).length} onClick={() => downloadCalendar(data.rentals)}><Icon name="download" size={17} /> Baixar agenda .ics</button>
      </footer>
    </Dialog>}
    {modal?.type === 'examples' && <Dialog title="Dados de exemplo" onClose={close}>
      <div className="dialog-body">
        <p className="muted">A demonstração inclui itens, clientes e locações fictícios. Você pode remover os exemplos quando quiser iniciar sua operação.</p>
        <p className="muted">Os cadastros criados ou editados por você e os itens e clientes vinculados às suas locações serão mantidos.</p>
        {clearError && <div className="form-error" role="alert">{clearError}</div>}
      </div>
      <footer className="dialog-footer"><button className="button secondary" onClick={close}>Voltar</button><button className="button danger" disabled={clearing} onClick={removeExamples}>Remover exemplos</button></footer>
    </Dialog>}
    <div className="toast-region" role="status">{toast && <div className="toast"><Icon name="check" size={19} />{toast}<button className="icon-button" aria-label="Dispensar mensagem" onClick={() => setToast('')}><Icon name="close" size={16} /></button></div>}</div>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
