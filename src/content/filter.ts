import { filterImages } from '@src/api'

export interface ImgFilterRes {
  imgURI: string
  error: Error
  pass: boolean
  reason: string
}

const IMPURE_IMG_CLASS = 'pv-impure-img'

// const impureImgs: HTMLImageElement[] = []
// const pureImgs: HTMLImageElement[] = []

// TODO: get imgs from other sources like background-image
function getPageImages (): HTMLImageElement[] {
  return [].slice.call(document.getElementsByTagName('img'))
    .filter((img: HTMLImageElement) => img.id !== 'purity-vision-panel-logo')
}

export async function filterPage (licenseID: string): Promise<any> {
  console.log('running Purity filter')

  const pageImages = getPageImages()

  // Preemptively blur/filter images to avoid showing explicit content before API filter request completes.
  hideImages(pageImages)

  try {
    await filterImgTags(pageImages, licenseID)
  } catch (err) {
    console.error(err)
  }
}

const hideImage = (img: HTMLImageElement): void => {
  img.classList.add(IMPURE_IMG_CLASS)
  const size = img.width > img.height ? img.width : img.height
  img.setAttribute('old-src', img.src)
  img.setAttribute('old-size', `${img.width}:${img.height}`)
  img.src = 'https://i.imgur.com/tmtD11P.png'
  img.width = size
  img.height = size
}

const hideImages = (imgs: HTMLImageElement[]): void => imgs.forEach(i => hideImage(i))

const showImage = (img: HTMLImageElement): void => {
  img.classList.remove(IMPURE_IMG_CLASS)
  img.src = img.getAttribute('old-src') ?? ''
  const split = img.getAttribute('old-size')?.split(':')
  if (split === undefined) {
    return
  }
  img.width = Number(split[0])
  img.height = Number(split[1])
}

export const showFilteredImages = (): void =>
  document.querySelectorAll(`img.${IMPURE_IMG_CLASS}`).forEach(i => showImage(i as HTMLImageElement))

// const showPageImages = (): void => { getPageImages().forEach(img => img.classList.remove(IMPURE_IMG_CLASS)) }
// const hidePageImages = (): void => hideImages(getPageImages())

async function filterImgTags (imgs: HTMLImageElement[], license: string): Promise<any> {
  if (imgs.length === 0) {
    return
  }

  const imgURIList = imgs.map(img => img.getAttribute('old-src') as string)

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

  // await sendFilterMsg(filterRes, imgs)

  showCleanImgs(filterRes, imgs)
}

const showCleanImgs = (res: ImgFilterRes[], imgs: HTMLImageElement[]): void => {
  const passed = res.filter(r => r.pass)
  imgs
    .filter(img => passed.find(res => res.imgURI === img.getAttribute('old-src') as string) !== undefined)
    .forEach(i => showImage(i))
}

// const sendFilterMsg = async (res: ImgFilterRes[], imgs: HTMLImageElement[]): Promise<void> => {
//   const filteredOutRes = res.filter(r => !r.pass)
//   const filteredImgURLs = imgs
//     .filter(img => filteredOutRes.find(res => res.imgURI === img.getAttribute('old-src') as string) !== undefined)
//     .map(fi => fi.currentSrc)

//   console.log('PURITY VISION is hiding these images: ')
//   for (const url of filteredImgURLs) {
//     console.log(url)
//   }

//   const msg: ContentMessage = {
//     imgURLs: filteredImgURLs
//   }

//   try {
//     await browser.runtime.sendMessage(msg)
//   } catch (err) {
//     console.error('failed to send filtered image message: ', err)
//   }
// }
