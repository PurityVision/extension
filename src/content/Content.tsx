import styled from '@emotion/styled'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { IconButton } from '@mui/material'
import { Button } from '@src/components/Button'
import EditLicense from '@src/components/EditLicense'
import { FlexBox, IconContainer, SlideUp } from '@src/components/Helpers'
import MenuStatus, { MenuStatusState } from '@src/components/MenuStatus'
import { LOGO_B64 } from '@src/constants'
import React, { useEffect, useState } from 'react'
import browser, { Runtime } from 'webextension-polyfill'
import { AppStorage, UpdatePanelVisibility } from '../worker'
import { runFilter, showFilteredImages } from './filter'
import CustomizedSnackbars, { Severity } from '@src/components/Alert'

const ExtensionWrapper = styled.div`
  width: fit-content;
  position: fixed;
  color: #434343;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 696969;
  margin: 0 0 0 1rem;
  max-width: 1054px !important;
  font-size: 14px !important;
  font-family: "Roboto","Helvetica","Arial",sans-serif;
`
interface ExtensionContentProps {
  readonly $panelVisible: boolean
}

const ExtensionContent = styled.div<ExtensionContentProps>`
  background-color: white;
  width: fit-content;
  border-radius: 5px 5px 0 0;
  box-shadow: rgb(0 0 0 / 29%) 0px 11px 15px 13px;
  border: 1px solid #c2c2c2;
  animation: ${SlideUp} 0.5s ease-out forwards;
`

const ExtensionMenu = styled.div`
  display: flex;
  padding: 7px;
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
  const [filterStatus, setFilterStatus] = useState<MenuStatusState>('off')
  const [filteredImgs, setFilteredImgs] = useState<string[]>([])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMsg, setAlertMsg] = useState<string>('')
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info')

  //useEffect(() => {
  //  if (license === '') {
  //    return
  //  }

  //  async function handleChange(changes: MutationRecord[], obs: MutationObserver) {
  //    const images: HTMLImageElement[] = []

  //    for (const change of changes) {
  //      if (change.addedNodes.length > 0) {
  //        for (let i = 0; i < change.addedNodes.length; i++) {
  //          if (change.addedNodes[i].nodeName === 'IMG') {
  //            const image = change.addedNodes[i] as HTMLImageElement
  //            // console.log('need to filter: ', img)
  //            images.push(image)
  //          }
  //        }
  //        const opts = {
  //          licenseID: license,
  //          wholePage: false,
  //          images
  //        }

  //        await filterPage(opts)
  //      }
  //    }
  //  }

  //  const obs = new MutationObserver(handleChange)
  //  const opts = {
  //    childList: true,
  //    subtree: true,
  //  }
  //  obs.observe(document.body, opts);

  //  return () => obs.disconnect()
  //})


  useEffect(() => {
    const init = async (): Promise<void> => {
      const storage = await browser.storage.local.get() as AppStorage

      if (!storage.whitelist.includes(window.location.host)) {
        setFilterStatus('not whitelisted')
      }

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
        setFilterStatus('loading')
        const opts = {
          licenseID: storage.licenseID,
          wholePage: true
        }
        setFilteredImgs(await runFilter(opts))
        setFilterStatus('active')
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
      setAlertSeverity('error')
      setAlertMsg('Add a valid license first')
      setAlertOpen(true)
      return
    }

    if (!whitelist.includes(window.location.host)) {
      setAlertSeverity('error')
      setAlertMsg('Add this site first')
      setAlertOpen(true)
      return
    }

    const storage = await browser.storage.local.get() as AppStorage

    const next = !storage.filterEnabled
    setFilterEnabled(next)

    if (next) {
      setFilterStatus('loading')
      const opts = {
        licenseID: storage.licenseID,
        wholePage: true
      }
      setFilteredImgs(await runFilter(opts))
      setFilterStatus('active')
    } else {
      setFilterStatus('off')
      showFilteredImages()
    }

    browser.storage.local
      .set({ filterEnabled: next })
      .catch(() => { })
  }

  const handleAddDomain = async (): Promise<void> => {
    if (license === '') {
      // toast.error('Add a valid license first')
      setAlertSeverity('error')
      setAlertMsg('Add a valid license first')
      setAlertOpen(true)
      return
    }

    if (whitelist.includes(window.location.host)) {
      // toast.error('Site is already added')
      setAlertSeverity('error')
      setAlertMsg('Site is already added')
      setAlertOpen(true)
      return
    }

    const nuWhitelist = whitelist.concat([window.location.host])
    setWhitelist(nuWhitelist)
    setFilterEnabled(true)

    try {
      setFilterStatus('loading')
      const opts = {
        licenseID: license,
        wholePage: true
      }
      setFilteredImgs(await runFilter(opts))
      setFilterStatus('active')
      await browser.storage.local.set({ whitelist: nuWhitelist, filterEnabled: true })
    } catch (err) {
      // toast.error('something went wrong')
      console.error('failed to set app storage: ', err)
    }
  }

  const handleRemoveDomain = (): void => {
    if (!whitelist.includes(window.location.host)) {
      return
    }

    const nuList = whitelist.filter(d => d !== window.location.host)
    setWhitelist(nuList)
    showFilteredImages()
    setFilterStatus('not whitelisted')
    browser.storage.local.set({ whitelist: nuList })
      .then(() => setFilterEnabled(false))
      .catch(err => console.error(err))
  }

  function filterButton(): JSX.Element {
    if (filterEnabled) {
      return (
        <Button
          onClick={() => { void handleToggleFilter() }}
          variant='contained'
          endIcon={
            <FontAwesomeIcon
              icon={faEyeSlash}
            />
          }
        >
          ON
        </Button>
      )
    } else {
      return (
        <Button
          onClick={() => { void handleToggleFilter() }}
          variant='contained'
          color='error'
          endIcon={
            <FontAwesomeIcon
              icon={faEye}
            />
          }
        >
          OFF
        </Button>
      )
    }
  }

  function whitelistButton(): JSX.Element {
    if (whitelist.includes(window.location.host)) {
      return (
        <Button
          onClick={handleRemoveDomain}
        >
          REMOVE THIS SITE
        </Button>
      )
    }

    return (
      <Button onClick={() => { void handleAddDomain() }}>
        ADD THIS SITE
      </Button>
    )
  }

  if (!panelVisible) {
    return <></>
  }

  return (
    <>
      <CustomizedSnackbars
        open={alertOpen}
        message={alertMsg}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
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
              onAlert={(msg: string, severity: Severity) => {
                setAlertSeverity(severity)
                setAlertMsg(msg)
                setAlertOpen(true)
              }}
            />
          </EditLicenseWrapper>
          <ExtensionMenu>
            <IconContainer
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
            </IconContainer>
            <MenuStatus state={filterStatus} count={filteredImgs.length} />
            {expanded &&
              <FlexBox $gap='10px'>
                {filterButton()}
                {whitelistButton()}
                <Button
                  variant='outlined'
                  onClick={() => setEditingLicense(!editingLicense)}
                >
                  EDIT LICENSE
                </Button>
              </FlexBox>}
            <IconButton
              onClick={() => setExpanded(!expanded)}
            >
              {!expanded
                ? <ArrowForwardIosIcon />
                : <ArrowBackIosNewIcon />
              }
            </IconButton>
          </ExtensionMenu>
        </ExtensionContent>
      </ExtensionWrapper>
    </>
  )
}

export default Content
