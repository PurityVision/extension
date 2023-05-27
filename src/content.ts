import browser from 'webextension-polyfill'
import { filterImages, health } from './api'
import { AppStorage, ContentMessage } from './worker'

interface ImgFilterRes {
  imgURI: string
  error: Error
  pass: boolean
  reason: string
}

browser.runtime.onMessage.addListener((request: { action: string }) => {
  switch (request.action) {
    case 'run filter':
      console.log('Running filter to hide bad images.')
      void main()
      break
    case 'disable filter':
      console.log('Turning off filter and resetting HTML.')
      showPageImages()
      void browser.runtime.sendMessage({ imgURLs: [] })
      break
  }
})

const IMPURE_IMG_CLASS = 'pv-impure-img'

// const impureImgs: HTMLImageElement[] = []
// const pureImgs: HTMLImageElement[] = []

const showPageImages = (): void => { getPageImages().forEach(img => img.classList.remove(IMPURE_IMG_CLASS)) }

const showLoadingTab = (): void => {
  const body = document.querySelector('body')
  const loadingTab = document.createElement('div')
  loadingTab.id = 'pv-loading-tab'
  const loadingSpinner = document.createElement('div')
  loadingSpinner.classList.add('lds-dual-ring')

  const loadingText = document.createElement('p')
  loadingText.innerText = 'Purity Vision Running...'

  loadingTab.appendChild(loadingSpinner)
  loadingTab.appendChild(loadingText)
  body?.appendChild(loadingTab)
}

const hideLoadingTab = (): void => {
  document.getElementById('pv-loading-tab')?.remove()
}

const testDomains = ['boards.4chan.org', 'boards.4channel.org', 'test.gradeycullins.com']

export async function main (): Promise<void> {
  const storage = await browser.storage.local.get() as AppStorage

  if (!storage.filterEnabled) {
    return
  }

  if (!storage.whitelist.includes(window.location.host)) {
    return
  }

  if (!testDomains.includes(window.location.hostname)) {
    return
  }

  // Don't do image filtering if the backend is not reachable.
  const res = await health()
  if (res === undefined) {
    console.log('something went wrong')
    return
  }

  if (res.status !== 200) {
    console.log(`Health endpoint failed with non-200 response: ${res.status}`)
    return
  }

  filterPage(storage.licenseID)
    .catch(err => console.error(err))
}

// TODO: get imgs from other sources like background-image
function getPageImages (): HTMLImageElement[] {
  return [].slice.call(document.getElementsByTagName('img'))
}

async function filterPage (licenseID: string): Promise<any> {
  console.log('running Purity filter')

  const pageImages = getPageImages()

  try {
    showLoadingTab()
    await filterImgTags(pageImages, licenseID)
  } catch (err) {
    console.error(err)
  } finally {
    hideLoadingTab()
  }
}

const hideImages = (imgs: HTMLImageElement[]): void => imgs.forEach(i => i.classList.add(IMPURE_IMG_CLASS))
// const hidePageImages = (): void => hideImages(getPageImages())

async function filterImgTags (imgs: HTMLImageElement[], license: string): Promise<any> {
  if (imgs.length === 0) {
    return
  }

  // Preemptively blur/filter images to avoid showing explicit content before API filter request completes.
  hideImages(imgs)

  const imgURIList = imgs.map(img => img.src)

  const res = await filterImages(imgURIList, license)
  if (res === undefined) {
    console.error('failed to fetch')
    return
  }
  if (res.status !== 200) {
    console.error(`Failed to get response from API with status ${res.status}`)
    return
  }
  const filterRes = await res.json() as ImgFilterRes[]

  await sendFilterMsg(filterRes, imgs)

  showCleanImgs(filterRes, imgs)
}

const sendFilterMsg = async (res: ImgFilterRes[], imgs: HTMLImageElement[]): Promise<void> => {
  const filteredOutRes = res.filter(r => !r.pass)
  const filteredImgURLs = imgs
    .filter(img => filteredOutRes.find(res => res.imgURI === img.src) !== undefined)
    .map(fi => fi.currentSrc)

  console.log('PURITY VISION is hiding these images: ')
  for (const url of filteredImgURLs) {
    console.log(url)
  }

  const msg: ContentMessage = {
    imgURLs: filteredImgURLs
  }

  try {
    await browser.runtime.sendMessage(msg)
  } catch (err) {
    console.error('failed to send filtered image message: ', err)
  }
}

const showCleanImgs = (res: ImgFilterRes[], imgs: HTMLImageElement[]): void => {
  const passed = res.filter(r => r.pass)
  imgs
    .filter(img => passed.find(res => res.imgURI === img.src) !== undefined)
    .forEach(i => { i.classList.remove(IMPURE_IMG_CLASS) })
}

const setupTabHTML = (): void => {
}

setupTabHTML()
void main()

// Take an img element and add/modify markup to mark the image as explicit.
// export function updateFilteredImgMarkup (img: HTMLImageElement) {
//   if (!img) {
//     console.log('here')
//     return
//   }

//   const parent = img.parentElement

//   // Add a warning tag to the filtered image.
//   const warningNode = document.createElement('p')
//   warningNode.classList.add('warning-tag')
//   warningNode.innerHTML = `
// ⚠️ Google Vision Detected <span class="fail-reason-text">${img.getAttribute('reason')}</span> content in this image`
//   addElWarnTag(img, warningNode, parent)

//   // Add a container element to the image to make the filter more obvious.
//   const wrapper = document.createElement('div')
//   wrapper.classList.add('blurred-img-wrapper')
//   wrapEl(img, wrapper, parent)
// }

// function wrapEl (el, wrapper, parent) {
//   if (!el || !wrapper || !parent) {
//     return
//   }
//   wrapper.setAttribute('style', `width: ${el.width}; height: ${el.height}`)
//   parent.replaceChild(wrapper, el)
//   wrapper.appendChild(el)
// }

// function addElWarnTag (el, warnNode, parent) {
//   if (!el || !warnNode || !parent) {
//     return
//   }
//   // TODO: get the image URL from: src attribute, background-url, etc.
//   parent.insertBefore(warnNode, el)
//   const button = document.getElementById(el.src)
//   button.addEventListener('click', () => el.classList.toggle('blurred-img'))
// }

// chrome.runtime.onMessage.addListener(onRecvMsg)

// async function onRecvMsg (msg) {
//   const imgURIList = msg.imgURIList

//   if (imgURIList.length === 0) {
//     return
//   }

//   try {
//     const res = await filterImages(imgURIList)
//     if (res.status !== 200) {
//       console.error(`Failed to get response from API with status ${res.status}`)
//       return
//     }

//     const imgFilterRes = await res.json()
//     console.log(imgFilterRes.imgFilterResList)
//     for (const res of imgFilterRes.imgFilterResList) {
//       if (res.pass) {
//         const imgs = document.getElementsByTagName('img')
//         for (const img of imgs) {
//           if (img.src === res.imgURI) {
//             img.src = res.imgURI
//           }
//         }
//       }
//     }
//     // TODO: for each filter response
//     // if filter passes, update img src tag.
//   } catch (err) {
//     console.log(err)
//   }
// }
