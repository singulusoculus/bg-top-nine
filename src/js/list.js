import uuidv4 from 'uuid'
import { renderCollectionEl, custConfirm } from './views'
import { getBGGCollectionData } from './bgg-collection'
import { getBGGSearchData } from './bgg-search'

let listData = []

const getListData = () => listData

const getListDataLength = () => listData.length

const setListData = (data) => {
  listData = createList(data)
}

const createListObject = (data) => {
  const obj = {
    id: data.id || uuidv4(),
    name: data.name,
    imageOriginal: data.imageOriginal || '',
    image: data.image || '',
    source: data.source,
    sourceType: data.sourceType || '',
    bggId: data.bggId || '',
    yearPublished: data.yearPublished || ''
  }
  return obj
}

// data takes in array of objects
const createList = (data) => {
  let list = []
  data.forEach((item) => {
    const obj = createListObject(item)
    list.push(obj)
  })
  return list
}

const addListItems = (list) => {
  const prevLength = listData.length

  list.forEach((item) => {
    item.name = item.name.replace(/["]+/g, '')
    listData.push(item)

    // create an img element and load the imageOriginal into it
    // this will load the images into cache as the user is creating their list and make the top 9 seem to generate faster
    const tempImagesEl = document.querySelector('.temp-images')
    const imgEl = new Image()
    tempImagesEl.appendChild(imgEl)
    // imgEl.onload = () => {
    //   tempImagesEl.removeChild(imgEl)
    // }
    imgEl.src = item.imageOriginal
  })

  if (listData.length > 0) {
    filterDuplicates()

    const currLength = listData.length
    const addedItems = currLength - prevLength

    // if (addedItems > 0) {
    //   M.toast({ html: `Added ${addedItems} items to your list`, displayLength: 1500 })
    // }

    if (addedItems === 0) {
      M.toast({ html: `This games has already been added.`, displayLength: 1500 })
    }

    const instance = M.Collapsible.getInstance(document.querySelector('.list-collapsible'))
    instance.open(0)

    renderCollectionEl('list')
  }
}

const filterDuplicates = () => {
  listData = listData.filter((list, index, self) => self.findIndex(l => l.name === list.name && l.bggId === list.bggId) === index)
}

const removeListItem = (item) => {
  const itemID = listData.findIndex((i) => i.id === item.id)

  // Show removed item back in Collection data
  if (item.sourceType === 'collection') {
    const bggData = getBGGCollectionData()
    const bggId = item.bggId
    const bggItem = bggData.findIndex((item) => item.bggId === bggId)
    bggData[bggItem].addedToList = false
    renderCollectionEl('bgg-collection')
  } else if (item.sourceType === 'search') {
    const searchData = getBGGSearchData()
    const bggId = item.bggId
    const bggItem = searchData.findIndex((item) => item.bggId === bggId)
    searchData[bggItem].addedToList = false
    renderCollectionEl('bgg-search')
  }

  listData.splice(itemID, 1)
  if (listData.length < 9) {
    const generateBtn = document.querySelector('.generate-btn')
    generateBtn.classList.add('disabled')
    generateBtn.classList.remove('generate-btn__ready')
  }
}

const handleClickClear = () => {
  const message = 'Are you sure you want to clear your list?'
  custConfirm(message, clearListData)
}

const clearListData = () => {
  const generateBtn = document.querySelector('.generate-btn')
  generateBtn.classList.add('disabled')
  generateBtn.classList.remove('generate-btn__ready')

  const tempImagesEl = document.querySelector('.temp-images')
  tempImagesEl.innerHTML = ''

  listData = []
  renderCollectionEl('list')

  const bggData = getBGGCollectionData()
  bggData.forEach((item) => {
    item.addedToList = false
  })

  renderCollectionEl('bgg-collection')

  const searchData = getBGGSearchData()
  searchData.forEach((item) => {
    item.addedToList = false
  })
  renderCollectionEl('bgg-search')
}

const sortListData = (list, sortBy) => {
  if (sortBy === 'alphabetical') {
    // for alpha sorts it is flipped - earlier letter in the alphabet is higher
    return list.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1
      } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1
      } else {
        return 0
      }
    })
  } else if (sortBy === 'bgg-rank') {
    return list.sort((a, b) => {
      if (a.bggRank > b.bggRank) {
        return 1
      } else if (a.bggRank < b.bggRank) {
        return -1
      } else {
        return 0
      }
    })
  } else {
    return list
  }
}

export {
  addListItems,
  removeListItem,
  getListData,
  sortListData,
  clearListData,
  createList,
  createListObject,
  handleClickClear,
  setListData,
  getListDataLength
}
