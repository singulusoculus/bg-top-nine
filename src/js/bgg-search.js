import { getBGGData, getBGGGameDetailData } from './bgg-functions'
import { renderCollectionEl } from './views'
import { sortListData } from './list'

let bggSearchData = []

const getBGGSearchData = () => bggSearchData

const handleBGGSearch = async (searchText, type) => {
  document.querySelector('.bgg-search__wrapper').classList.add('hide')
  jQuery('.ball-loading.search-results').fadeIn()
  document.querySelector('#bgg-search-submit').classList.add('disabled')
  bggSearchData = []
  searchText = searchText.trim().replace(/ /g, '+')

  // check for exact search
  let firstChar = searchText.charAt(0)
  let lastChar = searchText.charAt(searchText.length - 1)
  let exactSearch = false

  if (firstChar === `"` && lastChar === `"`) {
    exactSearch = true
    searchText = searchText.replace(/["]+/g, '')
  }

  let searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${searchText}`
  if (exactSearch) {
    searchUrl += `&exact=1`
  }
  let results
  if (type === 'boardgames') {
    // when asking for type boardgame, bgg returns both boardgame and boardgameexpansion types but does not label the expansions properly.
    // I have to request expansions explicitly and then filter based on that list
    let searchUrlBG = `${searchUrl}&type=boardgame`
    let bgResults = await getBGGData(searchUrlBG)

    let searchUrlEx = `${searchUrl}&type=boardgameexpansion`
    let exResults = await getBGGData(searchUrlEx)

    let expansionIds = []
    exResults.forEach((item) => {
      expansionIds.push(item['@attributes'].id)
    })

    results = bgResults.filter((i) => expansionIds.indexOf(i['@attributes'].id) < 0, expansionIds)
  } else {
    let searchUrlEx = `${searchUrl}&type=boardgameexpansion`
    results = await getBGGData(searchUrlEx)
  }

  let bggSearchItems = []
  results.forEach((i) => {
    bggSearchItems.push(i)
  })

  // Filter out duplicate bggIds
  bggSearchItems = bggSearchItems.filter((list, index, self) => self.findIndex(l => l['@attributes'].id === list['@attributes'].id) === index)

  // Filter for games with primary names only
  bggSearchItems = bggSearchItems.filter(item => item.name['@attributes'].type === 'primary')

  // Cut list down to 50
  bggSearchItems = bggSearchItems.slice(0, 50)

  let bggIds = []
  bggSearchItems.forEach((item) => {
    if (item.name['@attributes'].type === 'primary') {
      bggIds.push(item['@attributes'].id)
    }
  })

  let gameDetails = await getBGGGameDetailData(bggIds)
  gameDetails = sortListData(gameDetails, 'bgg-rank')

  bggSearchData = gameDetails

  jQuery('.ball-loading.search-results').fadeOut(() => {
    renderCollectionEl('bgg-search')
    document.querySelector('#bgg-search-submit').classList.remove('disabled')
  })
}

export { handleBGGSearch, getBGGSearchData }
