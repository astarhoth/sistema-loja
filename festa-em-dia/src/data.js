const storageKey = 'festa-em-dia:v1'
const dayMs = 86_400_000

export const statuses = {
  quote: { label: 'Orçamento', color: 'amber' },
  reserved: { label: 'Confirmada', color: 'green' },
  out: { label: 'Em locação', color: 'purple' },
  returned: { label: 'Devolvida', color: 'slate' },
  canceled: { label: 'Cancelada', color: 'red' },
}

const legacyCategories = ['Mobiliário', 'Decoração', 'Louças e bandejas', 'Estruturas', 'Brinquedos', 'Outros']
export const dateKey = (date = new Date()) => [
  date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0'),
].join('-')
export const parseDate = (key) => new Date(key + 'T12:00:00')
export const shiftDate = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
export const money = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
export const dateLabel = (key, options = { day: '2-digit', month: 'short' }) =>
  new Intl.DateTimeFormat('pt-BR', options).format(parseDate(key)).replaceAll('.', '')
export const normalize = (value) => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
export const totalFor = (rental) => rental.items.reduce((sum, item) => sum + item.quantity * item.price, rental.fee)
export const nextCode = (rentals) => Math.max(1000, ...rentals.map((rental) => rental.code)) + 1
export const findName = (entries, id) => entries.find((entry) => entry.id === id)?.name ?? 'Cadastro indisponível'
export const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
export const digits = (value) => value.replace(/\D/g, '')
export const fullDate = (value) => dateLabel(value, { day: '2-digit', month: '2-digit', year: 'numeric' })
export const isCurrentReservation = (rental, date = dateKey()) => rental.status === 'reserved' && rental.end >= date
export const defaultContractTemplate = {
  id: 'rental-standard', name: 'Contrato padrão de locação',
  terms: [
    'Objeto e prazo. A locação abrange os itens e quantidades deste documento, nas datas de saída e devolução indicadas.',
    'Pagamento. O valor total, o valor recebido e o saldo constam no quadro financeiro deste pedido.',
    'Conferência. As partes devem conferir as quantidades e registrar a condição dos itens na saída e na devolução.',
  ].join('\n\n'),
}

function migrateData(data) {
  const categories = data.categories ?? [
    ...[...new Set([...legacyCategories, ...data.products.map((entry) => entry.category).filter(Boolean)])]
      .map((name, index) => ({ id: 'category-' + index, name, parentId: '' })),
    { id: 'trays', name: 'Bandejas', parentId: '' },
    { id: 'plastic-trays', name: 'Bandejas de plástico', parentId: 'trays' },
    { id: 'glass-trays', name: 'Bandejas de vidro', parentId: 'trays' },
  ]
  const products = data.products.map((product) => {
    if (Object.hasOwn(product, 'categoryId')) return product
    const { category, ...entry } = product
    return { ...entry, categoryId: categories.find((candidate) => candidate.name === category)?.id ?? '' }
  })
  const previousTemplates = data.contractTemplates ?? []
  const contractTemplates = previousTemplates.length ? previousTemplates : [defaultContractTemplate]
  const previousIssuer = previousTemplates.find((entry) => entry.issuer)
  const company = data.company ?? {
    name: previousIssuer?.issuer ?? '', document: previousIssuer?.document ?? '', address: previousIssuer?.address ?? '',
  }
  return {
    ...data, products, categories, contractTemplates, company,
    defaultContractTemplateId: contractTemplates.some((entry) => entry.id === data.defaultContractTemplateId)
      ? data.defaultContractTemplateId : contractTemplates[0].id,
    contracts: data.contracts ?? [], employees: data.employees ?? [], expenses: data.expenses ?? [],
  }
}

export function categoryTree(categories, parentId = '', path = []) {
  return categories.filter((category) => category.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
    .flatMap((category) => {
      const branch = [...path, category]
      return [{ ...category, path: branch, label: branch.map((entry) => entry.name).join(' › ') }, ...categoryTree(categories, category.id, branch)]
    })
}

export function putCategory(data, category) {
  if (!category.name) throw new Error('Informe o nome da categoria.')
  const parent = categoryTree(data.categories).find((entry) => entry.id === category.parentId)
  if (category.parentId && (!parent || parent.path.some((entry) => entry.id === category.id))) {
    throw new Error('Escolha uma categoria superior fora deste ramo.')
  }
  if (data.categories.some((entry) => entry.id !== category.id && entry.parentId === category.parentId && normalize(entry.name) === normalize(category.name))) {
    throw new Error('Já existe uma categoria com este nome neste nível.')
  }
  return putRecord(data, 'categories', category)
}

export function removeCategory(data, id) {
  if (data.categories.some((entry) => entry.parentId === id) || data.products.some((entry) => entry.categoryId === id)) {
    throw new Error('Mova os itens e as subcategorias vinculados antes de remover esta categoria.')
  }
  return { ...data, categories: data.categories.filter((entry) => entry.id !== id) }
}

function exampleData() {
  const day = (offset) => dateKey(shiftDate(new Date(), offset))
  const products = [
    ['Painel redondo linho', 'Estruturas', 4, 9500],
    ['Cilindros em madeira (trio)', 'Mobiliário', 6, 12000],
    ['Mesa bistrô branca', 'Mobiliário', 12, 6500],
    ['Cadeira Tiffany cristal', 'Mobiliário', 80, 1250],
    ['Bandeja dourada', 'Louças e bandejas', 18, 1800],
    ['Arco desconstruído', 'Decoração', 5, 13500],
    ['Vaso de cerâmica bege', 'Decoração', 12, 2200],
    ['Toalha de mesa linho', 'Decoração', 24, 3500],
  ].map(([name, category, stock, price], i) => ({ id: 'item-' + i, name, category, stock, price, notes: '', example: true }))
  const clients = [
    ['Mariana Costa', '(81) 90000-0101', 'mariana@example.com'],
    ['Rafael Almeida', '(81) 90000-0102', 'rafael@example.com'],
    ['Camila Ribeiro', '(81) 90000-0103', 'camila@example.com'],
    ['Beatriz Lima', '(81) 90000-0104', 'beatriz@example.com'],
    ['Juliana Santos', '(81) 90000-0105', 'juliana@example.com'],
  ].map(([name, phone, email], i) => ({ id: 'client-' + i, name, phone, email, notes: '', example: true }))
  const rentals = [
    ['Aniversário da Helena', 0, 2, 3, 'reserved', [[0, 1], [1, 1], [4, 4], [5, 1]], 8000, 20000],
    ['Casamento no jardim', 1, 3, 5, 'quote', [[3, 60], [2, 4], [7, 8]], 12000, 0],
    ['Chá de bebê da Alice', 2, 4, 5, 'reserved', [[1, 1], [5, 1], [6, 3]], 6000, 15000],
    ['Festa de 15 anos da Luiza', 3, -1, 1, 'out', [[3, 40], [4, 8], [2, 5]], 9000, 52000],
    ['Noivado de Júlia e Pedro', 4, -6, -4, 'returned', [[3, 30], [7, 8], [0, 1]], 8000, 83000],
  ].map(([name, client, start, end, status, lines, fee, paid], i) => ({
    id: 'rental-' + i, code: 1005 - i, name, clientId: clients[client].id, start: day(start), end: day(end),
    status, items: lines.map(([product, quantity]) => ({ productId: products[product].id, quantity, price: products[product].price })),
    fee, paid, address: '', notes: '', example: true,
  }))
  return { products, clients, rentals }
}

export function loadData() {
  const saved = localStorage.getItem(storageKey)
  return migrateData(saved ? JSON.parse(saved) : exampleData())
}

// Mutations read the current snapshot so availability uses the latest saved reservations.
export async function updateData(change) {
  function save() {
    const next = change(loadData())
    localStorage.setItem(storageKey, JSON.stringify(next))
    return next
  }
  return navigator.locks ? navigator.locks.request(storageKey, save) : save()
}

export function watchData(refresh) {
  const onStorage = (event) => {
    if (event.key === storageKey || event.key === null) refresh(loadData())
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

const holdsStock = (rental) => rental.status === 'reserved' || rental.status === 'out'
const dayNumber = (key) => Date.parse(key) / dayMs
const stockEnd = (rental) => rental.status === 'out' && rental.end < dateKey() ? Infinity : dayNumber(rental.end)

export function availableStock(product, rentals, start, end, excludeId) {
  const changes = new Map()
  const change = (day, count) => changes.set(day, (changes.get(day) ?? 0) + count)
  for (const rental of rentals) {
    if (rental.id === excludeId || !holdsStock(rental)) continue
    const first = Math.max(dayNumber(start), dayNumber(rental.start))
    const last = Math.min(dayNumber(end), stockEnd(rental))
    if (first > last) continue
    const quantity = rental.items.find((item) => item.productId === product.id)?.quantity
    if (!quantity) continue
    change(first, quantity)
    change(last + 1, -quantity)
  }
  let occupied = 0
  let peak = 0
  for (const [, count] of [...changes].sort(([left], [right]) => left - right)) {
    occupied += count
    peak = Math.max(peak, occupied)
  }
  return Math.max(0, product.stock - peak)
}

export function putRental(data, rental) {
  if (!data.clients.some((client) => client.id === rental.clientId)) throw new Error('Selecione um cliente cadastrado.')
  if (!rental.start || !rental.end || rental.end < rental.start) throw new Error('A devolução deve ocorrer na data da saída ou depois.')
  if (!rental.items.length || new Set(rental.items.map((item) => item.productId)).size !== rental.items.length) {
    throw new Error('Inclua pelo menos um item e use uma linha por item do acervo.')
  }
  for (const item of rental.items) {
    const product = data.products.find((entry) => entry.id === item.productId)
    if (!product || !Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new Error('Revise os itens e as quantidades.')
    if (holdsStock(rental)) {
      const end = stockEnd(rental) === Infinity ? '9999-12-31' : rental.end
      const available = availableStock(product, data.rentals, rental.start, end, rental.id)
      if (item.quantity > available) throw new Error(`${product.name} tem ${available} un. disponível(is) nesse período.`)
    }
  }
  if (rental.paid > totalFor(rental)) throw new Error('O valor recebido não pode exceder o total da locação.')
  const existing = data.rentals.find((entry) => entry.id === rental.id)
  return {
    ...data,
    rentals: existing
      ? data.rentals.map((entry) => entry.id === rental.id ? { ...rental, code: existing.code, contractTemplateId: existing.contractTemplateId } : entry)
      : [{ ...rental, code: nextCode(data.rentals) }, ...data.rentals],
  }
}

export function putRecord(data, collection, entry) {
  const records = data[collection]
  const previous = records.find((record) => record.id === entry.id)
  if (collection === 'products' && entry.categoryId && !data.categories.some((category) => category.id === entry.categoryId)) {
    throw new Error('Selecione uma categoria cadastrada.')
  }
  if (collection === 'clients' && entry.cpf) {
    const cpf = digits(entry.cpf)
    const check = (size) => (Array.from(cpf.slice(0, size)).reduce((sum, digit, index) => sum + Number(digit) * (size + 1 - index), 0) * 10 % 11) % 10
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf) || check(9) !== Number(cpf[9]) || check(10) !== Number(cpf[10])) {
      throw new Error('Confira os dígitos do CPF.')
    }
    if (records.some((record) => record.id !== entry.id && record.cpf && digits(record.cpf) === cpf)) {
      throw new Error('Já existe um cliente com este CPF.')
    }
  }
  if (collection === 'products' && previous && entry.stock < previous.stock) {
    const available = availableStock(previous, data.rentals, '0001-01-01', '9999-12-31')
    if (entry.stock < previous.stock - available) throw new Error('O estoque informado é menor que o total comprometido em reservas simultâneas.')
  }
  return { ...data, [collection]: previous ? records.map((record) => record.id === entry.id ? entry : record) : [...records, entry] }
}

export function removeRecord(data, collection, id) {
  const used = collection === 'clients'
    ? data.rentals.some((rental) => rental.clientId === id)
    : data.rentals.some((rental) => rental.items.some((item) => item.productId === id))
  if (used) throw new Error('Este cadastro está vinculado a uma locação.')
  return { ...data, [collection]: data[collection].filter((entry) => entry.id !== id) }
}

export function clearExamples(data) {
  const rentals = data.rentals.filter((rental) => !rental.example || data.contracts.some((contract) => contract.rentalId === rental.id))
  return {
    ...data,
    rentals,
    products: data.products.filter((product) => !product.example || rentals.some((rental) => rental.items.some((item) => item.productId === product.id))),
    clients: data.clients.filter((client) => !client.example || rentals.some((rental) => rental.clientId === client.id)),
  }
}

export function agendaEntries(rentals) {
  return rentals.filter((rental) => holdsStock(rental) || rental.status === 'returned').flatMap((rental) => [
    { date: rental.start, type: 'Saída', rental },
    { date: rental.end, type: 'Devolução', rental },
  ]).sort((left, right) => left.date.localeCompare(right.date))
}
