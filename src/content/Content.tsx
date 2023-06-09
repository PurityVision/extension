import { faCaretRight, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button, { BlueButton, GreenButton, PulseButton, SecondaryButton } from '@src/components/Button'
import EditLicense from '@src/components/EditLicense'
import { Box, FlexBox, HoverFlexBox, Icon, SlideDown, SlideUp, SomeThing } from '@src/components/Helpers'
import { COLORS, LOGO_B64 } from '@src/constants'
import React, { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { styled } from 'styled-components'
import browser, { Runtime } from 'webextension-polyfill'
import { filterPage, showFilteredImages } from './filter'
import { AppStorage, UpdatePanelVisibility } from '../worker'

const ExtensionWrapper = styled.div`
  position: fixed;
  color: #434343;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 696969;
  margin: auto;
  max-width: 1054px;
  font-size: 14px;
`
interface ExtensionContentProps {
  readonly $panelVisible: boolean
}

const ExtensionContent = styled.div<ExtensionContentProps>`
  background-color: white;
  width: fit-content;
  padding: 7px;
  border-radius: 5px 5px 0 0;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 30px;;
  border: 1px solid #c2c2c2;
  animation: ${SlideUp} 1s ease-out forwards;
`

const ExtensionMenu = styled.div`
  display: flex;
  gap: 14px;
  align-items: stretch;
`

const EditLicenseWrapper = styled.div<{ readonly $isVisible: boolean }>`
  display: ${props => props.$isVisible ? 'block' : 'none'};
`

const Content = (): JSX.Element => {
  const [panelVisible, setPanelVisible] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [filterEnabled, setFilterEnabled] = useState(true)
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [license, setLicense] = useState<string>('')
  const [licenseSaved, setLicenseSaved] = useState(false)
  const [editingLicense, setEditingLicense] = useState(false)

  useEffect(() => {
    const init = async (): Promise<void> => {
      const storage = await browser.storage.local.get() as AppStorage

      setFilterEnabled(storage.filterEnabled)
      setWhitelist(storage.whitelist)
      setLicense(storage.licenseID)
      setPanelVisible(storage.panelVisible)

      if (storage.licenseID === '') {
        setExpanded(true)
        setEditingLicense(true)
        return
      }

      if (storage.filterEnabled && storage.whitelist.includes(window.location.host)) {
        void filterPage(storage.licenseID)
      } else {
        showFilteredImages()
      }
    }

    void init()
  }, [])

  useEffect(() => {
    if (!expanded) setEditingLicense(false)
  }, [expanded])

  useEffect(() => {
    const listener = (msg: UpdatePanelVisibility, sender: Runtime.MessageSender): void => {
      setPanelVisible(msg.visible)
    }

    browser.runtime.onMessage.addListener(listener)

    return () => {
      browser.runtime.onMessage.removeListener(listener)
    }
  }, [])

  useEffect(() => {
    const listener = (changes: browser.Storage.StorageAreaOnChangedChangesType): void => {
      if ('panelVisible' in changes) {
        setPanelVisible(changes.panelVisible.newValue)
      }
    }

    browser.storage.local.onChanged.addListener(listener)

    return () => {
      browser.storage.local.onChanged.removeListener(listener)
    }
  }, [])

  const handleToggleFilter = async (): Promise<void> => {
    if (license === '') {
      toast.error('Add a valid license first')
      return
    }

    if (!whitelist.includes(window.location.host)) {
      toast.error('Add this site first', { position: 'bottom-right' })
      return
    }

    const storage = await browser.storage.local.get() as AppStorage

    const next = !storage.filterEnabled
    setFilterEnabled(next)

    if (next) {
      void filterPage(storage.licenseID)
    } else {
      showFilteredImages()
    }

    browser.storage.local
      .set({ filterEnabled: next })
      .catch(() => {})
  }

  const handleAddDomain = async (): Promise<void> => {
    if (license === '') {
      toast.error('Add a valid license first')
      return
    }

    if (whitelist.includes(window.location.host)) {
      toast.error('Site is already added')
      return
    }

    const nuWhitelist = whitelist.concat([window.location.host])
    setWhitelist(nuWhitelist)
    setFilterEnabled(true)

    try {
      await filterPage(license)
      await browser.storage.local.set({ whitelist: nuWhitelist, filterEnabled: true })
    } catch (err) {
      toast.error('something went wrong')
      console.error('failed to set app storage: ', err)
    }
  }

  function filterButton (): JSX.Element {
    if (filterEnabled) {
      return (
        <BlueButton onClick={() => { void handleToggleFilter() }}>
          <div style={{ display: 'flex', gap: '3.5px', justifyItems: 'center', alignItems: 'center' }}>
            <span>ON</span>
            <FontAwesomeIcon
              icon={faEyeSlash}
            />
          </div>
        </BlueButton>
      )
    } else {
      return (
        <Button onClick={() => { void handleToggleFilter() }}>
          <div style={{ display: 'flex', gap: '5px', justifyItems: 'center', alignItems: 'center' }}>
            <span>OFF</span>
            <FontAwesomeIcon
              icon={faEye}
            />
          </div>
        </Button>
      )
    }
  }

  if (!panelVisible) {
    return <></>
  }

  return (
    <>
      <Toaster />
      <ExtensionWrapper id='purity-extension-container'>
        <ExtensionContent $panelVisible={panelVisible}>
          <EditLicenseWrapper $isVisible={editingLicense}>
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
              onCloseHandler={() => setEditingLicense(false)}
            />
          </EditLicenseWrapper>
          <ExtensionMenu>
            <Box
              $padding='0 0 0 7px'
            >
              <a href={process.env.LANDING_PAGE_URL} target='_blank' rel='noreferrer'>
                <img
                  id='purity-vision-panel-logo'
                  src={`data:image/png;base64,${LOGO_B64}`}
                  alt=''
                  style={{ height: '35px', verticalAlign: 'middle' }}
                />
              </a>
            </Box>
            {expanded &&
              <FlexBox $gap='10px'>
                {filterButton()}
                <GreenButton
                  onClick={() => { void handleAddDomain() }}
                >
                  ADD THIS SITE
                </GreenButton>
                <SecondaryButton
                  onClick={() => setEditingLicense(!editingLicense)}
                >
                  EDIT LICENSE
                </SecondaryButton>
              </FlexBox>}
            <HoverFlexBox
              $padding='0 14px 0 14px'
              $hoverColor={COLORS.lightGray}
              $borderRadius='5px'
              onClick={() => setExpanded(!expanded)}
            >
              <Icon
                icon={faCaretRight}
                style={{ width: '14px' }}
                rotation={expanded ? 180 : undefined}
              />
            </HoverFlexBox>
          </ExtensionMenu>
        </ExtensionContent>
      </ExtensionWrapper>
    </>
  )
}

export default Content
