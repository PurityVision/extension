import { annotateImages } from '@src/api'
import { FILTER_PAGE_SIZE } from '@src/constants'

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

export interface SafeSearchAnnotation {
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

interface FilterOpts {
  license: string
  wholePage?: boolean
  images?: HTMLImageElement[]
}

export async function filterPage ({
  license,
  wholePage = true,
  images
}: FilterOpts): Promise<string[]> {
  console.log('running Purity filter')
  if (!wholePage && (images == null)) {
    throw new Error('opts.wholePage and opts.images cannot both be undefined')
  }

  if (wholePage || images === undefined) {
    images = getPageImages()
  }

  // Preemptively blur/filter images to avoid showing explicit content before API filter request completes.
  hideImages(images)

  return await filterImgTags(images, license)
}

const hideImage = (img: HTMLImageElement): void => {
  img.classList.add(IMPURE_IMG_CLASS)
  // const size = img.width > img.height ? img.width : img.height
  // img.setAttribute('old-src', img.src)
  // img.setAttribute('old-size', `${img.width}:${img.height}`)
  // img.src = 'https://i.imgur.com/tmtD11P.png'
  // img.src = 'https://i.imgur.com/67VE1Lr.gif'
  // img.width = size
  // img.height = size
}

const hideImages = (imgs: HTMLImageElement[]): void => imgs.forEach(i => hideImage(i))

const showImage = (img: HTMLImageElement): void => {
  img.classList.remove(IMPURE_IMG_CLASS)
  // img.src = img.getAttribute('old-src') ?? ''
  // const split = img.getAttribute('old-size')?.split(':')
  // if (split === undefined) {
  //  return
  // }
  // img.width = Number(split[0])
  // img.height = Number(split[1])
}

export const showFilteredImages = (images?: HTMLImageElement[]): void => {
  if (images !== undefined) {
    images.forEach(i => showImage(i))
  } else {
    document.querySelectorAll(`img.${IMPURE_IMG_CLASS}`).forEach(i => showImage(i as HTMLImageElement))
  }
}

// const showPageImages = (): void => { getPageImages().forEach(img => img.classList.remove(IMPURE_IMG_CLASS)) }
// const hidePageImages = (): void => hideImages(getPageImages())

/**
 *
 * @param imgs - the images to filter
 * @param license - the license for Purity Vision API
 * @returns the images that were filtered (hidden) on the webpage
 */
async function filterImgTags (imgs: HTMLImageElement[], license: string): Promise<string[]> {
  if (imgs.length === 0) {
    return []
  }

  // const imgURIList = imgs.map(img => img.getAttribute('old-src') as string)
  const filteredImgURIs = []
  const imgURIs = imgs.map(img => img.src)

  for (let i = 0; i < imgURIs.length;) {
    let endIdx: number
    if (i + FILTER_PAGE_SIZE > imgURIs.length - 1) {
      endIdx = imgURIs.length
    } else {
      endIdx = i + FILTER_PAGE_SIZE
    }

    const uriPage = imgURIs.slice(i, endIdx)
    const imgsPage = imgs.slice(i, endIdx)

    const res = await annotateImages(uriPage, license)
    if (res === undefined || res.status !== 200) {
      throw new Error('failed to fetch')
    }

    const SSAs = await res.json() as SafeSearchAnnotation[] ?? []

    // const unsafeSSAs = showCleanImgs(SSAs, imgsPage)
    filteredImgURIs.push(...showCleanImgs(SSAs, imgsPage).map(ssa => ssa.uri))
    showUnfilteredImgs(SSAs, imgsPage)

    i += FILTER_PAGE_SIZE
  }

  return filteredImgURIs
}

const showUnfilteredImgs = (SSAs: SafeSearchAnnotation[], imgs: HTMLImageElement[]): void => {
  imgs
    .filter(img => SSAs.find(a => a.uri === img.src) === undefined)
    .forEach(img => showImage(img))
}

const isAnnotationSafe = (ssa: SafeSearchAnnotation): boolean => {
  // Image failed to filture so we assume it's safe to show.
  // NOTE: this is primarily to handle expired trial licenses,
  // other errors could warrant returning false.
  if (ssa.error.valid) {
    return true
  }

  if (ssa.adult >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  if (ssa.medical >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  if (ssa.violence >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  if (ssa.racy >= Likelihood.Likelihood_LIKELY) {
    return false
  }

  return true
}

// Impure side-effects function.
const showCleanImgs = (annotations: SafeSearchAnnotation[], imgs: HTMLImageElement[]): SafeSearchAnnotation[] => {
  const passed = annotations.filter(a => isAnnotationSafe(a))
  const failed = annotations.filter(a => !isAnnotationSafe(a))

  imgs
    .filter(img => passed.find(anno => anno.uri === img.src) !== undefined)
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
