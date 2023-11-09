import browser from 'webextension-polyfill'
import { filterPage, showFilteredImages } from './filter'
import { AppStorage, SiteToggleMessage } from '@src/worker'
import { validateLicense } from '@src/utils'

let observer: MutationObserver

const onLoad = (): void => {
  const init = async (): Promise<void> => {
    void tryRunFilter({})
    browser.runtime.onMessage.addListener(onSiteToggledListener)
  }

  init()
    .then(() => { /* */ })
    .catch(err => console.log(err))

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
        void tryRunFilter({ images: addedImgs })
      }
    }
  }
  observer = new MutationObserver(mutationCallback)
  observer.observe(window.document, { childList: true, subtree: true })
}

const tryRunFilter = async ({ images }: { images?: HTMLImageElement[] }): Promise<void> => {
  const storage = await browser.storage.local.get() as AppStorage

  try {
    const licenseValid = validateLicense(storage.license)
    if (!licenseValid) {
      console.log('license not valid, not running filter')
      return
    }
    if (!storage.whitelist.includes(window.location.host)) {
      return
    }
    if (images !== undefined) {
      await filterPage({ license: storage.license, wholePage: false, images })
    } else {
      await filterPage({ license: storage.license, wholePage: true })
    }
  } catch (err) {
    console.log(err)
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
