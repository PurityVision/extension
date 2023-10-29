import browser from 'webextension-polyfill'
import { filterPage, showFilteredImages } from './filter'
import { AppStorage } from '@src/worker'
import { validateLicense } from '@src/utils'

// Run filter if this host is whitelisted
const onLoad = (): void => {
  const init = async (): Promise<void> => {
    void tryRunFilter()
    registerOnWhitelisted()
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

const onWhitelistedListener = (changes: browser.Storage.StorageAreaOnChangedChangesType): void => {
  if (!('whitelist' in changes)) {
    return
  }

  const whitelist: string[] = changes.whitelist.newValue
  if (whitelist.includes(window.location.host)) {
    void tryRunFilter()
  } else {
    showFilteredImages()
  }
}

const registerOnWhitelisted = (): void => browser.storage.local.onChanged.addListener(onWhitelistedListener)

// Disable filter when this host is removed from whitelist

// Run filter on new DOM content when content is added to DOM

window.addEventListener('load', () => onLoad())
window.addEventListener('unload', () => browser.storage.onChanged.removeListener(onWhitelistedListener))
