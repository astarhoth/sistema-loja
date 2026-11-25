import React, { useState } from 'react'
import { categoryTree, putCategory, removeCategory } from './data.js'
import { Dialog, Empty, Icon } from './ui.jsx'

export function Categories({ data, edit }) {
  const tree = categoryTree(data.categories)
  if (!tree.length) return <section className="card"><Empty title="Nenhuma categoria cadastrada" description="Crie uma categoria para organizar seu acervo." /></section>
  return <section className="card category-list" aria-label="Hierarquia de categorias">
    {tree.map((category) => {
      const directItems = data.products.filter((product) => product.categoryId === category.id).length
      return <div className="category-row" key={category.id} style={{ '--depth': Math.min(5, category.path.length - 1) }}>
        <div className="category-name">
          <span className={'icon-tile ' + (category.parentId ? 'slate' : 'purple')}><Icon name="box" size={18} /></span>
          <div><button className="name-button" onClick={() => edit('category', category.id)}>{category.name}</button>
            <small>{category.parentId && category.path.slice(0, -1).map((entry) => entry.name).join(' › ') + ' · '}{directItems} {directItems === 1 ? 'item direto' : 'itens diretos'}</small>
          </div>
        </div>
        <div className="row-actions">
          <button className="button secondary small" onClick={() => edit('category', undefined, { parentId: category.id })}><Icon name="plus" size={16} /> Subcategoria</button>
          <button className="icon-button outlined" aria-label={'Editar ' + category.name} onClick={() => edit('category', category.id)}><Icon name="edit" size={17} /></button>
        </div>
      </div>
    })}
  </section>
}

export function CategoryForm({ data, record, parentId, save, onSaved, onClose }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(false)
  const parents = categoryTree(data.categories).filter((entry) => !entry.path.some((category) => category.id === record?.id))

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
    const category = { id: record?.id ?? crypto.randomUUID(), name: form.get('name').trim(), parentId: form.get('parentId') }
    commit((current) => putCategory(current, category), 'Categoria salva.')
  }

  return <Dialog title={record ? 'Editar categoria' : parentId ? 'Nova subcategoria' : 'Nova categoria'} onClose={onClose}>
    <form onSubmit={submit}>
      <div className="dialog-body form-grid">
        <label className="span-two">Nome da categoria<input name="name" defaultValue={record?.name} required maxLength={90} /></label>
        <label className="span-two">Categoria superior<select name="parentId" defaultValue={record?.parentId ?? parentId ?? ''}>
          <option value="">Nenhuma · categoria principal</option>
          {parents.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select></label>
        {error && <div className="form-error span-two" role="alert">{error}</div>}
        {removing && <p className="form-error span-two">Remover {record.name}? Essa ação é definitiva.</p>}
      </div>
      <footer className="dialog-footer">
        {record && (removing
          ? <button className="button danger push" type="button" disabled={busy} onClick={() => commit((current) => removeCategory(current, record.id), 'Categoria removida.')}>Confirmar remoção</button>
          : <button className="button text-danger push" type="button" onClick={() => setRemoving(true)}><Icon name="trash" size={17} /> Remover</button>)}
        <button type="button" className="button secondary" onClick={removing ? () => { setRemoving(false); setError('') } : onClose}>Cancelar</button>
        <button className="button primary" disabled={busy || removing}>Salvar categoria</button>
      </footer>
    </form>
  </Dialog>
}
