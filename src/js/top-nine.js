import { getListData } from './list'

const handleClickGenerate = () => {
  const listData = getListData()
  const images = checkforImages(listData)
  if (images) {
    const topNineModal = M.Modal.getInstance(document.querySelector('#top-nine-modal'))
    topNineModal.open()
    document.querySelector('#download-btn').classList.add('disabled')
    try {
      document.querySelector('.top-nine-image').setAttribute('style', 'display: none')
      renderTopNine(images)
    } catch (e) {
      jQuery('.ball-loading.top-nine').fadeOut()
      const imageWrapper = document.querySelector('.image-wrapper')
      const pEl = document.createElement('p')
      pEl.textContent = 'Sorry, we were unable to generate your top nine image. You can try again by closing this dialog and clicking the Generate Top 9 button again'
      imageWrapper.appendChild(pEl)
      console.log(e)
      throw new Error('Unable to render top nine Image')
    }
  }
}

const checkforImages = (data) => {
  const topNine = data.slice(0, 9)
  const images = []
  topNine.forEach(i => {
    if (i.imageOriginal !== '' && i.imageOriginal !== undefined) {
      images.push(i.imageOriginal)
    }
  })

  if (images.length === 9) {
    return images
  } else {
    return false
  }
}

const renderTopNine = async (images) => {
  jQuery('.ball-loading.top-nine').fadeIn()
  const canvasEl = document.createElement('canvas')
  canvasEl.width = 1080
  canvasEl.height = 1080
  const canvasElctx = canvasEl.getContext('2d')

  // document.querySelector('.temp-console').appendChild(canvasEl)

  await renderBackground(canvasElctx)

  for (let i = 0; i < images.length; i++) {
    await renderImage(i, images[i], canvasElctx)
  }

  await renderLogo(canvasElctx)
  renderFinalImage(canvasEl, canvasElctx)
}

const renderBackground = (ctx) => {
  return new Promise((resolve, reject) => {
    const backgroundImage = new Image()
    backgroundImage.onload = () => {
      ctx.drawImage(backgroundImage, 0, 0)
      resolve()
    }
    backgroundImage.src = '../images/background.png'
  })
}

const renderLogo = (ctx) => {
  return new Promise((resolve, reject) => {
    const logoImage = new Image()
    logoImage.onload = () => {
      ctx.drawImage(logoImage, 665, 995)
      resolve()
    }
    logoImage.src = '../images/pm-banner-top9.png'
  })
}

const renderImage = (index, image, ctx) => {
  return new Promise(async (resolve, reject) => {
    // console.log(`START ITEM ${index}`)
    const filename = `${index}.png`
    const mimeType = 'image/jpeg'
    const proxyURL = 'https://mighty-waters-78900.herokuapp.com/' // my implementation of cors-anywhere

    const file = await urlToFile(image, filename, mimeType, proxyURL)
    const data = await resizeImage(file, index)
    await renderSingleCanvas(data, ctx)
    // console.log(`END ITEM ${index}`)
    resolve()
  })
}

const getFileSize = (base64String) => {
  const stringLength = base64String.length - 'data:image/png;base64,'.length
  const sizeInBytes = 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812
  var sizeInKb = sizeInBytes / 1000
  return sizeInKb
}

const renderFinalImage = async (canvas, ctx) => {
  const finalImage = await canvas.toDataURL('image/png')
  const fileSize = getFileSize(finalImage)

  if (fileSize < 100) {
    // Try again
    const listData = getListData()
    const images = checkforImages(listData)
    renderTopNine(images)
  } else {
    jQuery('.ball-loading.top-nine').delay(100).fadeOut(async () => {
      // create blob for download button
      const blob = await (await fetch(finalImage)).blob()
      const url = (window.webkitURL || window.URL).createObjectURL(blob)
      const downloadBtnEl = document.querySelector('#download-btn')
      downloadBtnEl.href = url
      downloadBtnEl.classList.remove('disabled')

      document.querySelector('.top-nine-image').src = url

      jQuery('.top-nine-image').delay(100).fadeIn()
    })
  }
}

const renderSingleCanvas = (data, canvasElctx) => {
  return new Promise((resolve, reject) => {
    const canvasSingle = document.createElement('canvas')
    canvasSingle.width = 352
    canvasSingle.height = 352
    const ctxSingle = canvasSingle.getContext('2d')

    ctxSingle.drawImage(data.newImageEl, 0 + data.xOffset, 0 + data.yOffset, data.coverWidth, data.coverHeight)
    canvasElctx.drawImage(canvasSingle, data.x, data.y)
    // console.log('renderSingleCanvas: ', canvasSingle)
    resolve()
  })
}

const urlToFile = (url, filename, mimeType, proxyURL = '') => {
  return new Promise(async (resolve, reject) => {
    mimeType = mimeType || (url.match(/^data:([^;]+);/) || '')[1]
    const response = await fetch(proxyURL + url)
    // console.log('UTF Response: ', response)
    const buf = await response.arrayBuffer()
    // console.log('UTF Buffer: ', buf)
    const file = new File([buf], filename, { type: mimeType })
    // console.log('UTF File: ', file)
    resolve(file)
  })
}

const resizeImage = (file, index) => {
  const maxWidth = 352
  const maxHeight = 352
  const reader = new FileReader()
  const image = new Image()
  const canvas = document.createElement('canvas')

  const resize = async () => {
    return new Promise((resolve, reject) => {
      let width = image.width
      let height = image.height
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height
          height = maxHeight
        }
      }

      // Calculate cover dimensions
      const widthCalc = maxWidth - width
      const heightCalc = maxHeight - height
      let coverWidth = 0
      let coverHeight = 0
      let xOffset = 0
      let yOffset = 0

      if (widthCalc > heightCalc) {
        coverWidth = width + widthCalc
        coverHeight = height + widthCalc
      } else if (heightCalc > widthCalc) {
        coverWidth = width + heightCalc
        coverHeight = height + heightCalc
      } else {
        coverWidth = maxWidth
        coverHeight = maxHeight
      }

      // calculate offset - if widthe is longer than maxSize
      if (coverWidth > maxWidth) {
        xOffset = (maxWidth - coverWidth) / 2
      }

      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(image, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/png')

      const newImageEl = new Image()
      newImageEl.src = dataUrl

      const baseCoordinates = [
        { x: 6, y: 6 },
        { x: 364, y: 6 },
        { x: 722, y: 6 },
        { x: 6, y: 364 },
        { x: 364, y: 364 },
        { x: 722, y: 364 },
        { x: 6, y: 722 },
        { x: 364, y: 722 },
        { x: 722, y: 722 }
      ]

      const data = {
        newImageEl,
        // dataUrl,
        width,
        height,
        x: baseCoordinates[index].x,
        y: baseCoordinates[index].y,
        coverWidth,
        coverHeight,
        xOffset,
        yOffset,
        index
      }
      resolve(data)
    })
  }

  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) {
      reject(new Error('Not an image'))
      return
    }
    reader.onload = (readerEvent) => {
      image.onload = async () => {
        const data = await resize()
        // console.log('resize: ', data)
        resolve(data)
      }
      image.src = readerEvent.target.result
    }
    reader.readAsDataURL(file)
  })
}

export { renderTopNine, checkforImages, handleClickGenerate }
