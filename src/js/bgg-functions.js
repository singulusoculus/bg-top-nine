import { custMessage } from './views'
import { handleClickGenerate } from './top-nine'

const getBGGData = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => handleErrors(response))
      .then(response => response.text())
      .then(str => (new window.DOMParser()).parseFromString(str, 'text/xml'))
      .then(data => {
        const dataJSON = xmlToJson(data)
        let bggJSONData

        if (dataJSON.items) {
          bggJSONData = dataJSON.items.item
        } else if (dataJSON.user.top) {
          bggJSONData = dataJSON.user.top.item
        } else {
          bggJSONData = []
        }

        if (!Array.isArray(bggJSONData)) {
          if (bggJSONData) {
            bggJSONData = [bggJSONData]
          } else {
            bggJSONData = []
          }
        }
        // Always resolves an array
        resolve(bggJSONData)
      }).catch((error) => {
        console.log(error)
        custMessage(`There was an error fetching your collection. Check the username you entered. BGG servers may also be busy or you have made too many requests. Please try again in a minute.`)
        jQuery('.ball-loading.collection').fadeOut()
        document.querySelector('#bgg-submit').classList.remove('disabled')
      })
  })
}

const handleErrors = (response) => {
  if (!response.ok) {
    throw Error(response.statusText)
  }
  return response
}

const getBGGGameDetailData = (bggIds) => {
  return new Promise(async (resolve, reject) => {
    let dataURL = 'https://boardgamegeek.com/xmlapi2/thing?stats=1&id='
    bggIds.forEach((id) => {
      dataURL += id + ','
    })

    const results = await getBGGData(dataURL)
    let items = []

    results.forEach((i) => {
      items.push(i)
    })

    resolve(createBGGGameDataObjects(items))
  })
}

const createBGGGameDataObjects = (items) => {
  let bggGameData = []
  items.forEach((item) => {
    let gameDataDetails = {}
    gameDataDetails.bggId = item['@attributes'].id
    gameDataDetails.type = item['@attributes'].type
    gameDataDetails.minPlayers = item.minplayers['@attributes'].value
    gameDataDetails.maxPlayers = item.maxplayers['@attributes'].value
    gameDataDetails.minPlaytime = item.minplaytime['@attributes'].value
    gameDataDetails.maxPlaytime = item.maxplaytime['@attributes'].value
    gameDataDetails.playingtime = item.playingtime['@attributes'].value
    gameDataDetails.image = item.thumbnail ? item.thumbnail['#text'] : ''
    gameDataDetails.imageOriginal = item.image ? item.image['#text'] : ''

    // Links
    let mechanisms = []
    let categories = []
    let artists = []
    let designers = []
    let publishers = []

    if (!Array.isArray(item.link)) {
      item.link = [item.link]
    }

    item.link.forEach((link) => {
      if (link['@attributes'].type === 'boardgamemechanic') {
        mechanisms.push(link['@attributes'].value)
      }
      if (link['@attributes'].type === 'boardgamecategory') {
        categories.push(link['@attributes'].value)
      }
      if (link['@attributes'].type === 'boardgameartist') {
        artists.push(link['@attributes'].value)
      }
      if (link['@attributes'].type === 'boardgamedesigner') {
        designers.push(link['@attributes'].value)
      }
      if (link['@attributes'].type === 'boardgamepublisher') {
        publishers.push(link['@attributes'].value)
      }
    })
    gameDataDetails.mechanisms = mechanisms
    gameDataDetails.categories = categories
    gameDataDetails.artists = artists
    gameDataDetails.designers = designers
    gameDataDetails.publishers = publishers

    // Stats
    // .statistics.ratings.average["@attributes"].value
    const stats = item.statistics.ratings
    gameDataDetails.averageRating = stats.average['@attributes'].value
    gameDataDetails.numOwned = stats.owned['@attributes'].value

    // bggRank
    if (!Array.isArray(stats.ranks.rank)) {
      stats.ranks.rank = [stats.ranks.rank]
    }

    const rank = stats.ranks.rank.find((e) => e['@attributes'].name === 'boardgame')
    if (rank['@attributes'].value === 'Not Ranked') {
      gameDataDetails.bggRank = 1000000
    } else {
      gameDataDetails.bggRank = parseInt(rank['@attributes'].value)
    }

    // Names
    let altNames = []

    if (!Array.isArray(item.name)) {
      item.name = [item.name]
    }

    item.name.forEach((name) => {
      if (name['@attributes'].type === 'primary') {
        gameDataDetails.name = name['@attributes'].value
      }
      if (name['@attributes'].type === 'alternate') {
        altNames.push(name['@attributes'].value)
      }
    })

    gameDataDetails.altNames = altNames

    gameDataDetails.addedToList = false
    gameDataDetails.source = 'bgg'
    gameDataDetails.sourceType = 'search'

    bggGameData.push(gameDataDetails)
  })
  return bggGameData
}

// Changes XML to JSON
const xmlToJson = (xml) => {
  // Create the return object
  let obj = {}

  if (xml.nodeType === 1) { // element
    // attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {}
      for (let j = 0; j < xml.attributes.length; j++) {
        let attribute = xml.attributes.item(j)
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue
      }
    }
  } else if (xml.nodeType === 3) { // text
    obj = xml.nodeValue
  }

  // children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      let item = xml.childNodes.item(i)
      let nodeName = item.nodeName
      if (typeof (obj[nodeName]) === 'undefined') {
        obj[nodeName] = xmlToJson(item)
      } else {
        if (typeof (obj[nodeName].push) === 'undefined') {
          let old = obj[nodeName]
          obj[nodeName] = []
          obj[nodeName].push(old)
        }
        obj[nodeName].push(xmlToJson(item))
      }
    }
  }
  return obj
}

const checkForBGGTopTen = async (user) => {
  // check for BGG Top 10
  const bggTop10Url = `https://www.boardgamegeek.com/xmlapi2/user?name=${user}&top=1`
  const bggTop10 = await getBGGData(bggTop10Url)
  const collectionInfoEl = document.querySelector('.bgg-collection__wrapper')

  if (bggTop10.length > 9) {
    let bggIDs = []
    bggTop10.forEach((i) => {
      bggIDs.push(i['@attributes'].id)
    })
    bggIDs.pop()
    const bggTopNine = await getBGGGameDetailData(bggIDs)

    // Create button and append it to the BGG Collection section under (Change)
    const divEl = document.createElement('div')
    divEl.classList.add('center-align', 'generate-bgg-top-wrapper')
    const pEl = document.createElement('p')
    pEl.textContent = 'Use your BGG profile Top 10:'
    divEl.appendChild(pEl)
    const aEl = document.createElement('a')
    aEl.href = '#'
    aEl.classList.add('waves-effect', 'waves-lignt', 'btn', 'generate-bgg-top')
    aEl.addEventListener('click', () => {
      handleClickGenerate(bggTopNine)
    })
    const iEl = document.createElement('i')
    iEl.classList.add('material-icons', 'right')
    iEl.textContent = 'grid_on'
    aEl.textContent = 'Generate Top 9'
    aEl.appendChild(iEl)
    divEl.appendChild(aEl)
    collectionInfoEl.appendChild(divEl)
  } else {
    const generateBtn = document.querySelector('.generate-bgg-top-wrapper')
    if (generateBtn) {
      collectionInfoEl.removeChild(generateBtn)
    }
  }
}

export { getBGGData, getBGGGameDetailData, xmlToJson, checkForBGGTopTen }
