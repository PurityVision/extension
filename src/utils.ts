import browser, { Tabs } from 'webextension-polyfill'
import { getLicense } from './api'

export const getCurrentTab = async (): Promise<Tabs.Tab> => {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await browser.tabs.query(queryOptions)
  return tab
}

export const licensePattern = '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'

export const validateLicense = async (_license: string): Promise<boolean> => {
  const regexp = new RegExp(licensePattern)

  if (!regexp.test(_license)) return false

  const [license, err] = await getLicense(_license)
  return err === undefined && license !== undefined && license.isValid
}
