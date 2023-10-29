import styled from '@emotion/styled'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { FlexBox } from '@src/components/Helpers'
import { LOGO_B64 } from '@src/constants'
import { getCurrentTab, licensePattern, validateLicense } from '@src/utils'
import { AppStorage } from '@src/worker'
import React, { useEffect, useState } from 'react'
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

const Popup = (): JSX.Element => {
  const [siteWhitelisted, setSiteWhitelisted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [host, setHost] = useState('')
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [license, setLicense] = useState('')
  const [licenseValid, setLicenseValid] = useState(false)

  useEffect(() => {
    const init = async (): Promise<void> => {
      const storage = await browser.storage.local.get() as AppStorage
      setWhitelist(storage.whitelist)
      setLicense(storage.license)

      const tab = await getCurrentTab()
      const host = new URL(tab.url ?? '').host
      setHost(host)
      if (storage.whitelist.includes(host)) {
        setSiteWhitelisted(true)
      }

      try {
        setLicenseValid(await validateLicense(storage.license))
      } catch (err) {
        console.log(err)
        setLicenseValid(false)
      }

      setIsLoaded(true)
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
      } catch (err) {
        console.log(err)
      }
    }
    void toggleEnabledSite()
    setSiteWhitelisted(!siteWhitelisted)
  }

  const handleChangeLicense = (e: any): void => {
    const lic = e.target.value
    setLicense(lic)

    validateLicense(lic)
      .then(isValid => {
        if (isValid) {
          browser.storage.local.set({ license: lic })
            .catch(err => console.log(err))
        }
        setLicenseValid(isValid)
      })
      .catch(err => {
        console.log(err)
        setLicenseValid(false)
      })
  }

  return (
    <Wrapper>
      <TitleBox>
        <img
          src={`data:image/png;base64,${LOGO_B64}`}
          style={{ height: '35px', verticalAlign: 'middle' }}
        />
        <Title>
          {!whitelist.includes(host)
            ? <span style={{ color: 'red' }}>FILTER IS OFF</span>
            : <span style={{ color: 'green' }}>FILTER IS ON</span>}
        </Title>
      </TitleBox>
      {isLoaded &&
        <div>
          <FlexBox $gap='10px' style={{ alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 1rem 0' }}>
            <FormControlLabel
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
                  checked={siteWhitelisted}
                  onChange={handleChangeSiteWhitelisted}
                />
              }
              label='Filter This Site'
            />
          </FlexBox>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <TextField
              label='License'
              value={license}
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
          <Link href={process.env.LANDING_PAGE_URL} target='_blank' rel='noreferrer'>Get a License</Link>
        </div>}
    </Wrapper>
  )
}

export default Popup
