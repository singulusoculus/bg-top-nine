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

  let searchUrl = ''
  let results
  if (type === 'boardgames') {
    // when asking for type boardgame, bgg returns both boardgame and boardgameexpansion types but does not label the expansions properly.
    // I have to request expansions explicitly and then filter based on that list
    searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${searchText}&type=boardgame`
    let bgResults = await getBGGData(searchUrl)

    searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${searchText}&type=boardgameexpansion`
    let exResults = await getBGGData(searchUrl)

    let expansionIds = []
    exResults.forEach((item) => {
      expansionIds.push(item['@attributes'].id)
    })

    results = bgResults.filter((i) => expansionIds.indexOf(i['@attributes'].id) < 0, expansionIds)
  } else {
    searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${searchText}&type=boardgameexpansion`
    results = await getBGGData(searchUrl)
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
