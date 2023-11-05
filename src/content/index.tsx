import browser from 'webextension-polyfill'
import { filterPage, showFilteredImages } from './filter'
import { AppStorage, SiteToggleMessage } from '@src/worker'
import { validateLicense } from '@src/utils'

const onLoad = (): void => {
  const init = async (): Promise<void> => {
    void tryRunFilter()
    browser.runtime.onMessage.addListener(onSiteToggledListener)
  }

  init()
    .then(() => { /* */ })
    .catch(err => console.log(err))
}

const tryRunFilter = async (): Promise<void> => {
  const storage = await browser.storage.local.get() as AppStorage

  try {
    const licenseValid = await validateLicense(storage.license)
    if (!licenseValid) {
      console.log('license not valid, not running filter')
    }
    if (storage.whitelist.includes(window.location.host)) {
      await filterPage({ license: storage.license, wholePage: true })
    }
  } catch (err) {
    console.log(err)
  }
}

const onSiteToggledListener = (message: SiteToggleMessage): void => {
  if (message.isEnabled) {
    void tryRunFilter()
  } else {
    showFilteredImages()
  }
}

window.addEventListener('load', () => onLoad())
window.addEventListener('unload', () => browser.runtime.onMessage.removeListener(onSiteToggledListener))
