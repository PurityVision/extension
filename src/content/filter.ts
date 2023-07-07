import { filterImages } from '@src/api'

export interface ImgFilterRes {
  imgURI: string
  error: Error
  pass: boolean
  reason: string
}

enum Likelihood {
  // Unknown likelihood.
  Likelihood_UNKNOWN = 0,
  // It is very unlikely.
  Likelihood_VERY_UNLIKELY = 1,
  // It is unlikely.
  Likelihood_UNLIKELY = 2,
  // It is possible.
  Likelihood_POSSIBLE = 3,
  // It is likely.
  Likelihood_LIKELY = 4,
  // It is very likely.
  Likelihood_VERY_LIKELY = 5
}

export interface ImageAnnotation {
  hash: string
  uri: string
  error: {
    'string': string
    valid: boolean
  }
  dateAdded: string
  adult: Likelihood
  spoof: Likelihood
  medical: Likelihood
  violence: Likelihood
  racy: Likelihood
}

const IMPURE_IMG_CLASS = 'pv-impure-img'

// const impureImgs: HTMLImageElement[] = []
// const pureImgs: HTMLImageElement[] = []

// TODO: get imgs from other sources like background-image
function getPageImages (): HTMLImageElement[] {
  return [].slice.call(document.getElementsByTagName('img'))
    .filter((img: HTMLImageElement) => img.id !== 'purity-vision-panel-logo')
}

export async function filterPage (licenseID: string): Promise<string[]> {
  console.log('running Purity filter')

  const pageImages = getPageImages()

  // Preemptively blur/filter images to avoid showing explicit content before API filter request completes.
  hideImages(pageImages)

  try {
    return await filterImgTags(pageImages, licenseID)
  } catch (err) {
    showFilteredImages()
    console.error(err)
    return []
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

async function filterImgTags (imgs: HTMLImageElement[], license: string): Promise<string[]> {
  if (imgs.length === 0) {
    return []
  }

  const imgURIList = imgs.map(img => img.getAttribute('old-src') as string)

  const res = await filterImages(imgURIList, license)
  if (res === undefined || res.status !== 200) {
    throw new Error('failed to fetch')
  }

  const imageAnnotations = await res.json() as ImageAnnotation[]

  //await sendFilterMsg(imageAnnotations, imgs)

  const failedAnnotations = showCleanImgs(imageAnnotations, imgs)

  return failedAnnotations.map(anno => anno.uri)
}

const isAnnotationSafe = (annotation: ImageAnnotation): boolean => {
  if (annotation.adult >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  if (annotation.medical >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  if (annotation.violence >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  if (annotation.violence >= Likelihood.Likelihood_VERY_LIKELY) {
    return false
  }

  if (annotation.racy >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  return true
}

// Impure side-effects function.
const showCleanImgs = (annotations: ImageAnnotation[], imgs: HTMLImageElement[]): ImageAnnotation[] => {
  const passed = annotations.filter(a => isAnnotationSafe(a))
  const failed = annotations.filter(a => !isAnnotationSafe(a))

  imgs
    .filter(img => passed.find(anno => anno.uri === img.getAttribute('old-src') as string) !== undefined)
    .forEach(i => showImage(i))

  return failed
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
