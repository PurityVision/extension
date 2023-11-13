import browser from 'webextension-polyfill'
import { filterPage, showFilteredImages } from './filter'
import { AppStorage, SiteToggleMessage } from '@src/worker'
import { validateLicense } from '@src/utils'
import { getLicense } from '@src/api'

let observer: MutationObserver

const onLoad = (): void => {
  const init = async (): Promise<void> => {
    try {
      await tryRunFilter({})
    } catch (error) {
      showFilteredImages()
    }
    browser.runtime.onMessage.addListener(onSiteToggledListener)
  }

  init()
    .catch(err => console.log(err))
    .finally(() => {
      const mutationCallback = (mutationList: MutationRecord[]): void => {
        for (const mutation of mutationList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const addedImgs: HTMLImageElement[] = []
            mutation.addedNodes.forEach(node => {
              if (node.nodeName === 'IMG') {
                addedImgs.push(node as HTMLImageElement)
              }
            })
            if (addedImgs.length === 0) {
              return
            }
            tryRunFilter({ images: addedImgs })
              .catch(err => { console.log(err) })
          }
        }
      }
      observer = new MutationObserver(mutationCallback)
      observer.observe(window.document, { childList: true, subtree: true })
    })
}

const tryRunFilter = async ({ images }: { images?: HTMLImageElement[] }): Promise<void> => {
  const storage = await browser.storage.local.get() as AppStorage

  const licenseValid = validateLicense(storage.license)
  if (!licenseValid) {
    throw new Error('license not valid, not running filter')
  }
  const [license, err] = await getLicense(storage.license)
  if (license === undefined || !license.isValid || license.validityReason !== '') {
    throw new Error(err?.message)
  }

  if (!storage.whitelist.includes(window.location.host)) {
    return
  }
  if (images !== undefined) {
    await filterPage({ license: storage.license, wholePage: false, images })
  } else {
    await filterPage({ license: storage.license, wholePage: true })
  }
}

const onSiteToggledListener = (message: SiteToggleMessage): void => {
  if (message.isEnabled) {
    void tryRunFilter({})
  } else {
    showFilteredImages()
  }
}

window.addEventListener('load', () => onLoad())
window.addEventListener('unload', () => {
  browser.runtime.onMessage.removeListener(onSiteToggledListener)
  observer.disconnect()
})
