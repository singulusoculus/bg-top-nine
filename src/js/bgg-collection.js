import { custMessage, renderCollectionEl } from './views'
import { addListItems, getListData, createList, getListDataLength } from './list'
import { filterBGGCollection } from './filters'
import { getBGGData } from './bgg-functions'
import uuidv4 from 'uuid'

let bggCollectionData = []

const getBGGCollectionData = () => bggCollectionData

const handleBGGCollectionRequest = async () => {
  const user = document.querySelector('#bgg-username').value.trim().replace(/ /g, '%20')

  if (user === '') {
    custMessage('Please input your BGG user name')
  } else {
    const expansions = document.querySelector('#bgg-expansions').checked ? 1 : 0
    bggCollectionData = await getBGGCollection(user, expansions)

    jQuery('.ball-loading.collection').fadeOut(() => {
      document.querySelector('#bgg-submit').classList.remove('disabled')
      showBGGCollectionSection()
      renderCollectionEl('bgg-collection')
    })
  }
}

const getBGGCollection = (user, expansions) => new Promise(async (resolve, reject) => {
  jQuery('.ball-loading.collection').fadeIn()
  document.querySelector('#bgg-submit').classList.add('disabled')

  let queryUrl = `https://www.boardgamegeek.com/xmlapi2/collection?username=${user}&stats=1`

  if (expansions === 0) {
    queryUrl += '&excludesubtype=boardgameexpansion'
  }

  let results = await getBGGData(queryUrl)
  let bggList = createBGGList(results)

  queryUrl += '&played=1'
  let playedResults = await getBGGData(queryUrl)
  let played = createBGGList(playedResults)

  played.forEach((item) => {
    bggList.push(item)
  })

  bggList = bggList.filter((list, index, self) => self.findIndex(l => l.bggId === list.bggId) === index)
  resolve(bggList)
})

const createBGGList = (data) => {
  const listData = getListData()
  let items = data
  let bggList = []

  if (!Array.isArray(items)) {
    items = [items]
  }

  items.forEach((item) => {
    const statusAttributes = item.status['@attributes']

    const obj = {
      id: uuidv4(),
      name: item.name ? item.name['#text'] : 'No Title',
      source: 'bgg',
      sourceType: 'collection',
      imageOriginal: item.image ? item.image['#text'] : '',
      image: item.thumbnail ? item.thumbnail['#text'] : '',
      yearPublished: item.yearpublished ? parseInt(item.yearpublished['#text']) : 0,
      bggId: item['@attributes'].objectid,
      own: statusAttributes.own === '1',
      fortrade: statusAttributes.fortrade === '1',
      prevowned: statusAttributes.prevowned === '1',
      want: statusAttributes.want === '1',
      wanttobuy: statusAttributes.wanttobuy === '1',
      wanttoplay: statusAttributes.wanttoplay === '1',
      wishlist: statusAttributes.wishlist === '1',
      played: item.numplays['#text'] > 0,
      plays: item.numplays['#text'],
      rated: item.stats['rating']['@attributes'].value !== 'N/A',
      rating: item.stats['rating']['@attributes'].value === 'N/A' ? 0 : parseInt(item.stats['rating']['@attributes'].value),
      addedToList: false
    }

    if (listData.map(e => e.bggId).indexOf(obj.bggId) > -1) {
      obj.addedToList = true
    }

    bggList.push(obj)
  })

  return bggList
}

const showBGGCollectionSection = () => {
  document.querySelector('.bgg-list').classList.remove('hide')
  document.querySelector('.bgg-username-submit').classList.add('hide')
  const bggUsername = document.querySelector('#bgg-username').value
  document.querySelector('.bgg-username-header').textContent = `BGG Collection: ${bggUsername}`
  const bggUsernameSubmittedEl = document.querySelector('.bgg-collection__wrapper')
  bggUsernameSubmittedEl.classList.remove('hide')
}

const handleCollectionChangeClick = () => {
  bggCollectionData = []
  document.querySelector('.bgg-list').classList.add('hide')
  document.querySelector('.bgg-username-submit').classList.remove('hide')
  document.querySelector('.bgg-collection__wrapper').classList.add('hide')

  sessionStorage.removeItem('bggCollection')
}

const addBGGItemToList = (item, type) => {
  const length = getListDataLength()
  if (length < 9) {
    item.addedToList = true

    const list = createList([item])
    addListItems(list)

    if (type === 'bgg-collection') {
      renderCollectionEl('bgg-collection')
    } else if (type === 'bgg-search') {
      renderCollectionEl('bgg-search')
    }

    const newLength = getListDataLength()
    if (newLength === 9) {
      const generateBtn = document.querySelector('.generate-btn')
      generateBtn.classList.remove('disabled')
      generateBtn.classList.add('generate-btn__ready')
    }
  } else {
    custMessage('You already have nine games on your list. Either remove some to add different ones or go ahead and generate your top nine.')
  }
}

const handleAddSelectedBGG = () => {
  const filteredList = filterBGGCollection(bggCollectionData)

  filteredList.forEach((item) => {
    item.addedToList = true
  })

  const list = createList(filteredList)
  addListItems(list)

  renderCollectionEl('bgg-collection')
}

export {
  handleBGGCollectionRequest,
  getBGGCollectionData,
  addBGGItemToList,
  handleAddSelectedBGG,
  handleCollectionChangeClick
}
