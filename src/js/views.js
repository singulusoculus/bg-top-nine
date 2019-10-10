import { getListData, removeListItem } from './list'
import { getBGGCollectionData, addBGGItemToList } from './bgg-collection'
import { getBGGSearchData } from './bgg-search'
import { filterBGGCollection, filterBGGSearch, filterListData } from './filters'

// //////////////////////////////////////////////////////////////////////
// // RENDER LIST COLLECTIONS
// //////////////////////////////////////////////////////////////////////

const renderCollectionEl = (type) => {
  let data
  let filteredItems

  // data, filtering, and header
  if (type === 'list') {
    data = getListData()
    filteredItems = filterListData(data)
    const count = data.length
    const listInfoEl = document.querySelector('#list-info')
    listInfoEl.textContent = `Your List: ${count} items`
  } else if (type === 'bgg-collection') {
    data = getBGGCollectionData()
    filteredItems = filterBGGCollection(data)
    const listInfoEl = document.querySelector('.bgg-collection-info')
    const totalCount = data.length
    const addedList = data.filter((item) => item.addedToList !== false)
    const addedCount = addedList.length
    const filteredCount = filteredItems.length
    listInfoEl.textContent = `Filtered: ${filteredCount} | Added: ${addedCount} | Total: ${totalCount} `
  } else if (type === 'bgg-search') {
    data = getBGGSearchData()
    filteredItems = filterBGGSearch(data)
    const searchResultsHeaderEl = document.querySelector('.bgg-search-results-header__title')
    const searchLength = filteredItems.length
    searchResultsHeaderEl.textContent = `Search Results: ${searchLength}`
  }

  // render items
  const collectionItemsEl = document.querySelector(`.${type}__items`)
  collectionItemsEl.innerHTML = ''

  if (filteredItems.length > 0) {
    filteredItems.forEach((item) => {
      const itemEl = generateCollectionDOM(item, type)
      collectionItemsEl.appendChild(itemEl)
    })
    collectionItemsEl.classList.add('collection')
  }

  if (type !== 'list') {
    const wrapperEl = document.querySelector(`.${type}__wrapper`)
    wrapperEl.classList.remove('hide')
  }
}

const generateCollectionDOM = (item, type) => {
  const itemEl = document.createElement('li')
  itemEl.classList.add('collection-item', 'list-item')
  const imgDiv = document.createElement('div')
  imgDiv.classList.add('list-item__image-container')
  const imgEl = document.createElement('img')
  imgEl.classList.add('list-item__image')
  if (item.image !== '') {
    imgEl.src = item.image
    imgDiv.appendChild(imgEl)
  }
  itemEl.appendChild(imgDiv)

  const itemNameEl = document.createElement('span')
  itemNameEl.classList.add('list-item__title')
  itemNameEl.textContent = item.name

  const iconEl = document.createElement('a')
  iconEl.classList.add('list-item__icon')
  iconEl.href = '#!'

  // Add icons and click events
  if (type === 'list') {
    iconEl.innerHTML = '<i class="material-icons">delete</i>'
    iconEl.addEventListener('click', (e) => {
      removeListItem(item)
      renderCollectionEl('list')
    })
  } else if (type === 'bgg-collection') {
    iconEl.innerHTML = '<i class="material-icons">add</i>'
    iconEl.addEventListener('click', (e) => {
      addBGGItemToList(item, type)
      renderCollectionEl('bgg-collection')
      renderCollectionEl('list')
    })
    // I may be able to combine the two bgg items into one
  } else if (type === 'bgg-search') {
    iconEl.innerHTML = '<i class="material-icons">add</i>'
    iconEl.addEventListener('click', (e) => {
      addBGGItemToList(item, type)
      renderCollectionEl('list')
    })
  }

  itemEl.appendChild(itemNameEl)
  itemEl.appendChild(iconEl)

  return itemEl
}

// //////////////////////////////////////////////////////////////////////
// // MODALS / CUSTOM CONFIRMS
// //////////////////////////////////////////////////////////////////////

const custConfirm = (message, resultCallback) => {
  const alertText = document.querySelector('.alert-text')
  alertText.innerText = message

  const instance = M.Modal.getInstance(document.querySelector('#alert-modal'))
  instance.open()

  const eventFunc = () => {
    resultCallback()
    clearAlertEventListeners()
  }

  const clearAlertEventListeners = () => {
    document.querySelector('#alert-ok-btn').removeEventListener('click', eventFunc)
  }

  document.querySelector('#alert-ok-btn').addEventListener('click', eventFunc)

  document.querySelector('#alert-cancel-btn').addEventListener('click', () => {
    clearAlertEventListeners()
    instance.close()
  })
}

const custMessage = (message) => {
  document.querySelector('.message-text').textContent = message

  const instance = M.Modal.getInstance(document.querySelector('#message-modal'))
  instance.open()
}

export {
  renderCollectionEl,
  custConfirm,
  custMessage
}
