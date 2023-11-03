import browser, { Tabs } from 'webextension-polyfill'

export const getCurrentTab = async (): Promise<Tabs.Tab> => {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await browser.tabs.query(queryOptions)
  return tab
}

export const licensePattern = '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'

export const validateLicense = (license: string): boolean => {
  const regexp = new RegExp(licensePattern)
  return regexp.test(license)
}
