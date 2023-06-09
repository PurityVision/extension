import { faCaretRight, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button, { BlueButton, GreenButton, PulseButton, SecondaryButton } from '@src/components/Button'
import EditLicense from '@src/components/EditLicense'
import { Box, FlexBox, HoverFlexBox, Icon, SlideBox } from '@src/components/Helpers'
import { COLORS, LOGO_B64 } from '@src/constants'
import React, { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { styled } from 'styled-components'
import browser from 'webextension-polyfill'
import { filterPage, main, showFilteredImages } from '.'
import { AppStorage } from '../worker'

const ExtensionWrapper = styled.div`
  position: fixed;
  color: #434343;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 696969;
  margin: auto;
  max-width: 1054px;
`

const ExtensionContent = styled.div`
  background-color: white;
  width: fit-content;
  padding: 0.5rem;
  border-radius: 5px 5px 0 0;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 30px;;
  border: 1px solid #c2c2c2;
`

const ExtensionMenu = styled.div`
  display: flex;
  gap: 1rem;
  align-items: stretch;
`

const EditLicenseWrapper = styled.div<{ readonly $isVisible: boolean }>`
  display: ${props => props.$isVisible ? 'block' : 'none'};
`

const Content = (): JSX.Element => {
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

      if (storage.licenseID === '') {
        // TODO: show or indicate UI for user to enter UI
        return
      }

      if (storage.filterEnabled && storage.whitelist.includes(window.location.host)) {
        void filterPage(license)
      } else {
        showFilteredImages()
      }
    }

    void init()
  }, [])

  useEffect(() => {
    if (!expanded) setEditingLicense(false)
  }, [expanded])

  const handleToggleFilter = async (): Promise<void> => {
    if (!whitelist.includes(window.location.host)) {
      toast.error('Add this site first', { position: 'bottom-right' })
      return
    }

    const storage = await browser.storage.local.get() as AppStorage

    const next = !storage.filterEnabled
    setFilterEnabled(next)

    if (next) {
      void main()
    } else {
      showFilteredImages()
    }

    browser.storage.local
      .set({ filterEnabled: next })
      .catch(() => {})
  }

  const handleAddDomain = async (): Promise<void> => {
    if (whitelist.includes(window.location.host)) {
      toast.error('Site is already added')
      return
    }

    const nuWhitelist = whitelist.concat([window.location.host])
    setWhitelist(nuWhitelist)
    setFilterEnabled(true)

    try {
      await main()
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
          <div style={{ display: 'flex', gap: '0.25rem', justifyItems: 'center', alignItems: 'center' }}>
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
          <div style={{ display: 'flex', gap: '0.25rem', justifyItems: 'center', alignItems: 'center' }}>
            <span>OFF</span>
            <FontAwesomeIcon
              icon={faEye}
            />
          </div>
        </Button>
      )
    }
  }

  function licenseButton (): JSX.Element {
    if (license === '') {
      return (
        <PulseButton
          onClick={() => setEditingLicense(!editingLicense)}
        >
          ADD LICENSE
        </PulseButton>
      )
    } else {
      return (
        <SecondaryButton
          onClick={() => setEditingLicense(!editingLicense)}
        >
          EDIT LICENSE
        </SecondaryButton>
      )
    }
  }

  return (
    <>
      <Toaster />
      <ExtensionWrapper id='purity-extension-container'>
        <ExtensionContent>
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
              $padding='0 0 0 0.5rem'
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
                {licenseButton()}
              </FlexBox>}
            <HoverFlexBox
              $padding='0 1rem 0 1rem'
              $hoverColor={COLORS.lightGray}
              $borderRadius='5px'
              onClick={() => setExpanded(!expanded)}
            >
              <Icon
                icon={faCaretRight}
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
