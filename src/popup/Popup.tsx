import styled from '@emotion/styled'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { getLicense } from '@src/api'
import { FlexBox } from '@src/components/Helpers'
import { LOGO_B64 } from '@src/constants'
import { getCurrentTab, licensePattern, validateLicense } from '@src/utils'
import { AppStorage } from '@src/worker'
import React, { ChangeEvent, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'

const Wrapper = styled.div`
  padding: 10px 20px;
  width: 450px;
`

const Title = styled.h1`
  font-size: 20px;
`

const TitleBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #c9c9c9;
  padding-bottom: 1rem;
  align-items: center;
  justify-content: space-between;
`

const LicenseErrText = styled.p`
  color: red;
`

const LicenseSwitchLabel = styled(FormControlLabel)`
  border-radius: 5px;
  padding: 0 10px 0 10px;

  :hover {
    background: #e8e8e8;
  }
`

const Popup = (): JSX.Element => {
  const [siteWhitelisted, setSiteWhitelisted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [host, setHost] = useState('')
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [licenseID, setLicenseID] = useState('')
  const [licenseValid, setLicenseValid] = useState(false)
  const [usage, setUsage] = useState(0)
  const [invalidLicenseError, setInvalidLicenseError] = useState('')

  useEffect(() => {
    const init = async (): Promise<void> => {
      const storage = await browser.storage.local.get() as AppStorage
      setWhitelist(storage.whitelist)
      setLicenseID(storage.license)

      const tab = await getCurrentTab()
      const host = new URL(tab.url ?? '').host
      setHost(host)
      if (storage.whitelist.includes(host)) {
        setSiteWhitelisted(true)
      }

      try {
        if (storage.license === '') {
          return
        }
        if (!validateLicense(storage.license)) {
          setInvalidLicenseError('license not valid')
          return
        }

        const [license, err] = await getLicense(storage.license)
        if (err !== undefined) {
          setInvalidLicenseError(err.message)
          return
        }
        if (license === undefined) {
          setInvalidLicenseError('license not found')
          return
        }

        setLicenseValid(license.isValid)
        setInvalidLicenseError(license.validityReason)
        setUsage(license.requestCount)
      } catch (err) {
        console.log(err)
        setLicenseValid(false)
      } finally {
        setIsLoaded(true)
      }
    }
    void init()
  }, [])

  const handleChangeSiteWhitelisted = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const isEnabled = e.target.checked
    const toggleEnabledSite = async (): Promise<void> => {
      try {
        let tmp: string[]
        if (isEnabled) {
          tmp = whitelist.concat([host])
        } else {
          tmp = whitelist.filter(h => h !== host)
        }
        setWhitelist(tmp)
        await browser.storage.local.set({ whitelist: tmp })
        const tab = await getCurrentTab()
        if (tab.id !== undefined) {
          await browser.tabs.sendMessage(tab.id, { host, isEnabled })
        }
      } catch (err) {
        console.log(err)
      }
    }
    void toggleEnabledSite()
    setSiteWhitelisted(!siteWhitelisted)
  }

  const handleChangeLicense = (e: ChangeEvent<HTMLInputElement>): void => {
    const licenseID = e.target.value
    setLicenseID(licenseID)

    if (licenseID.trim() === '') {
      setInvalidLicenseError('')
      setLicenseValid(false)
      return
    }

    if (!validateLicense(licenseID)) {
      setLicenseValid(false)
      setInvalidLicenseError('not a valid license')
      return
    }

    getLicense(licenseID)
      .then(([license, err]) => {
        if (err !== undefined || license === undefined) {
          setLicenseValid(false)
          return
        }

        setLicenseValid(license.isValid)
        setUsage(license.requestCount)

        if (!license.isValid) {
          setInvalidLicenseError(license.validityReason)
        }

        browser.storage.local.set({ license: licenseID })
          .catch(err => console.log(err))
      })
      .catch(err => {
        setLicenseValid(false)
        console.log(err)
      })
  }

  return (
    <Wrapper>
      <TitleBox>
        <a href={process.env.LANDING_PAGE_URL} target='_blank' rel='noreferrer'>
          <img
            src={`data:image/png;base64,${LOGO_B64}`}
            style={{ height: '35px', verticalAlign: 'middle' }}
          />
        </a>
        <div>
          <Title>
            {!whitelist.includes(host)
              ? <span style={{ color: 'red' }}>FILTER IS OFF</span>
              : <span style={{ color: 'green' }}>FILTER IS ON</span>}
          </Title>
          <div className='flex gap-4 text-xl'>
            <span>Usage this period: </span>
            <span>{usage}</span>
          </div>
        </div>
      </TitleBox>
      {isLoaded &&
        <div>
          <FlexBox $gap='10px' style={{ alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 1rem 0' }}>
            <LicenseSwitchLabel
              style={{
                marginLeft: 0,
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%'
              }}
              labelPlacement='start'
              control={
                <Switch
                  disabled={!licenseValid}
                  checked={siteWhitelisted && licenseValid}
                  onChange={handleChangeSiteWhitelisted}
                />
              }
              label='Filter This Site'
            />
          </FlexBox>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <TextField
              label='License'
              value={licenseID}
              fullWidth
              onChange={handleChangeLicense}
              inputProps={{
                pattern: licensePattern
              }}
            />

            {licenseValid
              ? <CheckCircleIcon
                  style={{
                    color: 'green',
                    transform: 'translateX(-37px)',
                    position: 'fixed',
                    right: 0
                  }}
                />

              : <CancelIcon
                  className='text-red-400'
                  style={{
                    color: 'red',
                    transform: 'translateX(-37px)',
                    position: 'fixed',
                    right: 0
                  }}
                />}
          </div>
          {invalidLicenseError !== '' && <LicenseErrText>{invalidLicenseError}</LicenseErrText>}
          <Link href={process.env.LANDING_PAGE_URL} target='_blank' rel='noreferrer'>Get a License</Link>
        </div>}
    </Wrapper>
  )
}

export default Popup
