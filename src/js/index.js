import '../styles/main.scss'
import { handleBGGCollectionRequest, handleCollectionChangeClick } from './bgg-collection'
import { handleBGGSearch } from './bgg-search'
import { setBGGFilters, setBGGSearchFilters } from './filters'
import { renderCollectionEl } from './views'
import { handleClickClear } from './list'
import { handleClickGenerate } from './top-nine'

jQuery(document).ready(() => {
  M.AutoInit()

  // Footer Info
  const version = 'v1.0.0'
  const today = new Date()
  const year = today.getFullYear()
  document.querySelector('.footer-copyright').textContent = `Designed by Brian Casey | ${version} | © ${year} Pub Meeple`

  document.querySelector('#bgg-submit').addEventListener('click', () => {
    handleBGGCollectionRequest()
  })

  document.querySelector('.change-bgg-username').addEventListener('click', () => {
    handleCollectionChangeClick()
  })

  document.querySelector('#bgg-search-submit').addEventListener('click', () => {
    const searchText = document.querySelector('#bgg-search').value
    const typeEls = document.getElementsByName('bgg-search-type')
    let type
    typeEls.forEach((i) => {
      if (i.checked) {
        type = i.id
      }
    })

    handleBGGSearch(searchText, type)
  })

  document.querySelector('#bgg-search-sort-select').addEventListener('change', (e) => {
    setBGGSearchFilters({
      sortBy: e.target.value
    })
    renderCollectionEl('bgg-search')
  })

  // BGG Filters
  document.querySelectorAll('.bgg-cb').forEach((el) => {
    el.addEventListener('change', (e) => {
      const element = e.target.className
      setBGGFilters({
        [element]: e.target.checked
      })
      renderCollectionEl('bgg-collection')
    })
  })

  // BGG Collection Filters
  document.querySelector('#search-collection').addEventListener('input', (e) => {
    setBGGFilters({
      searchText: e.target.value
    })
    renderCollectionEl('bgg-collection')
  })

  document.querySelector('#personal-rating').addEventListener('change', (e) => {
    setBGGFilters({
      rating: parseInt(e.target.value)
    })
    renderCollectionEl('bgg-collection')
  })

  document.querySelector('#clear-list').addEventListener('click', () => {
    handleClickClear()
  })

  document.querySelector('.generate-btn').addEventListener('click', () => {
    handleClickGenerate()
  })
})
