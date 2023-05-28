import { faEye, faEyeSlash, faPlus, faSpinner, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@src/components/Button'
import EditLicense from '@src/components/EditLicense'
import { getCurrentTab } from '@src/utils'
import { AppStorage } from '@src/worker'
import React, { ReactElement, ReactNode, useEffect, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import browser from 'webextension-polyfill'
// import difference from 'lodash/difference'
// import { Tooltip } from 'react-tooltip'

const Title = ({ children }: { children: ReactNode }): ReactElement =>
  <p className='text-lg mb-1 font-semibold'>{children}</p>

export interface DomainsStorage {
  domains: string[]
}

interface WrapperProps {
  children: ReactNode
}

const Wrapper = ({ children }: WrapperProps): JSX.Element => <div className='p-4 w-[42rem] text-[14px]'>{children}</div>

const sendActiveTabMsg = async (msg: any): Promise<any> => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  if (tabs.length < 1 || tabs[0].id === undefined) {
    return
  }
  try {
    return await browser.tabs.sendMessage(tabs[0].id, msg)
  } catch (err) {
    console.error('failed to send message to tab: ', err)
  }
}

const Popup = (): JSX.Element => {
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [imgs, setImgs] = useState<string[]>([])
  const [filterEnabled, setFilterEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [siteEnabled, setSiteEnabled] = useState(false)
  const [license, setLicense] = useState<string>('')
  const [licenseSaved, setLicenseSaved] = useState(false)
  const [editingLicense, setEditingLicense] = useState(false)
  // const [showImages, setShowImages] = useState(true)

  useEffect(() => {
    const sendTestMsg = async (): Promise<void> => {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true })
      if (tabs.length < 1 || tabs[0].id === undefined) {
        return
      }
      void browser.tabs.sendMessage(tabs[0].id, 'hello world')
    }

    void sendTestMsg()
  }, [])

  useEffect(() => {
    const fetchAppStorage = async (): Promise<AppStorage | null> => {
      let storage: AppStorage

      try {
        storage = await browser.storage.local.get() as AppStorage
        console.log('loaded user storage: ', storage)
      } catch (err) {
        const msg = `failed to load local storage: ${(err as Error).message}`
        console.error(msg)
        return null
      } finally {
        setLoading(false)
      }
      return storage
    }

    const loadAppStorage = async (storage: AppStorage): Promise<void> => {
      setWhitelist(storage.whitelist)
      setFilterEnabled(storage.filterEnabled)

      if (storage.licenseID !== undefined && storage.licenseID !== '') {
        setLicenseSaved(true)
      }
      setLicense(storage.licenseID)

      try {
        const tab = await getCurrentTab()
        if (tab?.id === undefined || tab?.url === undefined) {
          throw new Error('Current tab was undefined')
        }

        const currentHost = new URL(tab.url).host
        if (storage.whitelist.includes(currentHost)) {
          setSiteEnabled(true)
        }

        // const tabID = tab.id
        // if (storage.tabs[tabID] !== undefined && storage.filterEnabled && storage.whitelist.includes(currentHost)) {
        //   setImgs(storage.tabs[tabID])
        // }
      } catch (err) {

      }
    }

    const init = async (): Promise<void> => {
      const storage = await fetchAppStorage()
      if (storage !== null) {
        void loadAppStorage(storage)
      }
    }

    void init()
  }, [])

  const handleAddDomain = async (): Promise<void> => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs[0] === undefined || tabs[0].url === undefined) {
      return
    }
    const url = new URL(tabs[0].url)
    const host = url.host

    if (whitelist.includes(host)) {
      toast.error('Site is already added')
      return
    }

    const nuWhitelist = whitelist.concat([url.host])
    setWhitelist(nuWhitelist)
    setFilterEnabled(true)

    try {
      await browser.storage.local.set({ whitelist: nuWhitelist, filterEnabled: true })
      setSiteEnabled(true)
      void sendActiveTabMsg({ action: 'run filter' })
    } catch (err) {
      toast.error('something went wrong')
      console.error('failed to set app storage: ', err)
    }
  }

  // const onToggleShowImages = async (): Promise<void> => {
  //   try {
  //     const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  //     console.log(tabs)
  //     const res = await browser.tabs.sendMessage(tabs[0].id ?? 0, { showImages: !showImages })
  //     console.log(res)
  //     if (res.didUpdate === true) {
  //       setShowImages(!showImages)
  //     }
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  const handleToggleActive = (): void => {
    if (!siteEnabled) {
      toast.error('Add this site first')
      return
    }

    const nextFilterState = !filterEnabled
    setFilterEnabled(nextFilterState)
    browser.storage.local
      .set({ filterEnabled: nextFilterState })
      .catch(() => {})

    void sendActiveTabMsg({ action: nextFilterState ? 'run filter' : 'disable filter' })
  }

  if (loading) {
    return (
      <Wrapper>
        <FontAwesomeIcon icon={faSpinner} className='animate-spin text-2xl' />
      </Wrapper>
    )
  }

  if (!licenseSaved || editingLicense) {
    return (
      <Wrapper>
        <EditLicense
          license={license}
          setLicense={setLicense}
          onSaveLicense={license => {
            browser.storage.local.set({ licenseID: license })
              .then(() => {
                setLicenseSaved(true)
                setEditingLicense(false)
              })
              .catch(err => { console.error(err) })
          }}
        />
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Toaster />
      <div className='flex items-center justify-between gap-2 mb-4'>
        <Button
          className={`
            flex text-lg gap-1 items-center cursor-pointer
            ${!filterEnabled ? 'text-red-500 border-red-500 hover:bg-red-100' : ''}
          `}
          onClick={handleToggleActive}
        >
          <span className='font-bold select-none'>
            {filterEnabled ? 'ON' : 'OFF'}
          </span>

          <FontAwesomeIcon
            icon={filterEnabled ? faEyeSlash : faEye}
            className={filterEnabled ? 'text-blue-500' : 'text-red-500'}
          />
        </Button>
        {/* <Button onClick={() => { void onToggleShowImages() }}>{showImages ? 'Hide' : 'Show'} Images</Button> */}
        {/* <Button onClick={() => onBlurImages()}>Blur Images</Button> */}
        <Button onClick={() => { setEditingLicense(true) }}>Edit License</Button>
      </div>

      {/* My filtered sites. */}
      <section className='mb-4'>
        <Title>
          Enabled Sites
        </Title>
        <div className='max-h-36 overflow-y-auto'>
          {whitelist.length === 0
            ? <p className='italic text-gray-600'>No websites are being filtered</p>
            : whitelist.map((dom, i) =>
              <div key={i} className='flex items-center gap-2 mb-1'>
                <FontAwesomeIcon
                  id='helpIcon'
                  icon={faTrashCan}
                  className='text-xl text-gray-400 cursor-pointer hover:text-red-400 transition-colors'
                  onClick={() => {
                    const copyArr = [...whitelist]
                    copyArr.splice(i, 1)
                    setWhitelist(copyArr)
                    browser.storage.local.set({ domains: copyArr })
                      .then(() => {
                        toast.success('Site was removed')
                        setSiteEnabled(false)
                      })
                      .catch(err => console.error('failed to update domains in local storage: ', err))
                  }}
                />
                <p className='text-gray-600 select-none'>
                  {dom}
                </p>
              </div>
            )}
        </div>
      </section>

      {/* Filtered images */}
      {/* <section id='blocked-images-container'>
        <Title>Filtered Images</Title>
        {imgs.length === 0
          ? <p className='italic text-gray-600'>No images being filtered</p>
          : imgs.map((img, i) =>
            <p key={i}>{img}</p>
          )}
      </section> */}

      {/* Button row */}
      <section className='flex justify-between'>
        <Button onClick={() => { void handleAddDomain() }}>
          <div className='flex gap-2 items-center'>
            <FontAwesomeIcon icon={faPlus} />
            <span>Add this site</span>
          </div>
        </Button>
      </section>
    </Wrapper>
  )
}

export default Popup
