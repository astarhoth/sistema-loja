let database

function openPhotos() {
  if (!database) {
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open('festa-em-dia-photos', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('photos')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('O navegador não conseguiu acessar as fotos.'))
    }).catch((error) => { database = undefined; throw error })
  }
  return database
}

async function accessPhoto(mode, action) {
  const db = await openPhotos()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', mode)
    const request = action(transaction.objectStore('photos'))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onabort = () => reject(new Error('O navegador não conseguiu armazenar ou ler a foto.'))
  })
}

export const readPhoto = (id) => accessPhoto('readonly', (store) => store.get(id))
const deletePhoto = (id) => accessPhoto('readwrite', (store) => store.delete(id))

async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Selecione uma foto JPG, PNG ou WebP.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Selecione uma foto de até 20 MB.')
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('Não foi possível abrir a foto selecionada.') })
  try {
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível preparar a foto.')), 'image/webp', 0.83)
    })
  } finally {
    bitmap.close()
  }
}

export async function savePhotoRecord(save, collection, entry, form, update) {
  const file = form.get('photo')
  const remove = form.has('removePhoto')
  const photoId = file?.size ? crypto.randomUUID() : ''
  if (photoId) {
    const photo = await preparePhoto(file)
    await accessPhoto('readwrite', (store) => store.put(photo, photoId))
  }
  let previousId
  try {
    await save((data) => {
      previousId = data[collection].find((record) => record.id === entry.id)?.photoId
      return update(data, collection, { ...entry, photoId: photoId || (remove ? '' : previousId) })
    })
  } catch (error) {
    if (photoId) await deletePhoto(photoId).catch(() => {})
    throw error
  }
  if (previousId && (photoId || remove)) await deletePhoto(previousId).catch(() => {})
}

export async function removePhotoRecord(save, collection, id, remove) {
  let photoId
  await save((data) => {
    photoId = data[collection].find((record) => record.id === id)?.photoId
    return remove(data, collection, id)
  })
  if (photoId) await deletePhoto(photoId).catch(() => {})
}
