import { digits, findName, fullDate, money, putRecord, statuses, totalFor } from './data.js'

export const templateFor = (data, rental) =>
  data.contractTemplates.find((template) => template.id === rental.contractTemplateId)
  ?? data.contractTemplates.find((template) => template.id === data.defaultContractTemplateId)

export function rentalDocument(data, rental) {
  const template = templateFor(data, rental)
  const customer = data.clients.find((entry) => entry.id === rental.clientId) ?? {}
  const address = [
    [customer.street, customer.addressNumber].filter(Boolean).join(', '), customer.complement, customer.neighborhood,
    [customer.city, customer.state].filter(Boolean).join(' / '), customer.postalCode && 'CEP ' + customer.postalCode,
  ].filter(Boolean).join(' · ')
  const { name, cpf, rg } = customer
  return {
    rentalCode: rental.code, status: rental.status,
    template: {
      ...template,
      issuer: data.company.name || template.issuer || 'Minha locadora',
      document: data.company.document || template.document,
      address: data.company.address || template.address,
    },
    client: { name, cpf, rg, address },
    event: rental.name, start: rental.start, end: rental.end, delivery: rental.address,
    items: rental.items.map((item) => ({ ...item, name: findName(data.products, item.productId) })),
    fee: rental.fee, paid: rental.paid, total: totalFor(rental),
  }
}

export function saveTemplate(data, template, makeDefault) {
  if (!template.name || !template.terms) throw new Error('Preencha o nome e as condições do modelo.')
  const next = putRecord(data, 'contractTemplates', template)
  return { ...next, defaultContractTemplateId: makeDefault ? template.id : data.defaultContractTemplateId }
}

export function setDefaultTemplate(data, id) {
  if (!data.contractTemplates.some((template) => template.id === id)) throw new Error('Modelo indisponível.')
  return { ...data, defaultContractTemplateId: id }
}

export function removeTemplate(data, id) {
  if (data.defaultContractTemplateId === id) throw new Error('Defina outro modelo como padrão antes de remover este.')
  return {
    ...data,
    contractTemplates: data.contractTemplates.filter((template) => template.id !== id),
    rentals: data.rentals.map((rental) => rental.contractTemplateId === id ? { ...rental, contractTemplateId: '' } : rental),
  }
}

export function setRentalTemplate(data, rentalId, templateId) {
  if (templateId && !data.contractTemplates.some((template) => template.id === templateId)) throw new Error('Modelo indisponível.')
  return { ...data, rentals: data.rentals.map((rental) => rental.id === rentalId ? { ...rental, contractTemplateId: templateId } : rental) }
}

export function whatsAppNumber(phone = '') {
  const value = digits(phone).replace(/^00/, '')
  if (!phone.trim().startsWith('+') && !phone.trim().startsWith('00') && /^\d{10,11}$/.test(value)) return '55' + value
  return /^[1-9]\d{9,14}$/.test(value) ? value : ''
}

export function orderMessage(order) {
  const { template, client } = order
  return [
    `Olá, ${client.name}! Segue seu pedido #${order.rentalCode} · ${template.issuer}.`,
    `${order.event} · ${statuses[order.status].label}`,
    `Saída em ${fullDate(order.start)} · Devolução em ${fullDate(order.end)}`,
    order.delivery && 'Entrega ou retirada: ' + order.delivery,
    '',
    ...order.items.map((item) => `• ${item.quantity} × ${item.name} · ${money(item.quantity * item.price)}`),
    '',
    `Taxa de entrega: ${money(order.fee)}`,
    `Total: ${money(order.total)} · Recebido: ${money(order.paid)} · Saldo: ${money(order.total - order.paid)}`,
    '',
    template.name,
    template.terms,
  ].filter((line) => line !== false && line !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')
}
