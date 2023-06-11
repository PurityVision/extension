import { faCheckCircle, faX, faXmarkCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button as MButton } from '@mui/material'
import Link from '@mui/material/Link'
import { getLicense } from '@src/api'
import { COLORS } from '@src/constants'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { styled } from 'styled-components'

interface AddLicenseProps {
  license: string
  setLicense: React.Dispatch<React.SetStateAction<string>>
  onSaveLicense: (license: string) => void
  onCloseHandler: any
}

const validateLicense = async (licenseID: string): Promise<boolean> => {
  const [license, err] = await getLicense(licenseID)
  if (err !== undefined) {
    toast.error('Failed to reach Purity Vision API')
    console.error('failed to fetch license: ', err)
    return false
  }

  if (license == null) {
    toast.error('License was not found')
    return false
  }

  if (!license.isValid) {
    toast.error('License has expired or is invalid')
  }
  return license?.isValid
}

const Wrapper = styled.div`
  padding: 14px;
  border-bottom: 1px solid ${COLORS.lightGray};
`

const EditLicense: React.FC<AddLicenseProps> = (
  { license, setLicense, onSaveLicense, onCloseHandler }
): JSX.Element => {
  const [isValid, setIsValid] = useState<boolean>(false)

  useEffect(() => {
    if (license === '') {
      return
    }
    validateLicense(license)
      .then(isValid => setIsValid(isValid))
      .catch(err => { console.error(err) })
  }, [license])

  return (
    <Wrapper>
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ marginBottom: '5px', marginTop: '5px' }}>Your License</h2>
          <FontAwesomeIcon
            icon={faX}
            onClick={onCloseHandler}
            style={{
              width: '8px',
              cursor: 'pointer'
            }}
          />
        </div>
        <p style={{ marginTop: 0, marginBottom: '5px' }}>Enter your Purity Vision license</p>
        <Link href={process.env.LANDING_PAGE_URL} target='_blank' rel='noreferrer'>
          Get your license
        </Link>
      </div>
      <form onSubmit={e => {
        e.preventDefault()
        validateLicense(license)
          .then(isValid => {
            setIsValid(isValid)

            if (isValid) {
              onSaveLicense(license)
            }
          })
          .catch(err => {
            console.error(err)
            toast.error(err)
          })
      }}
      >
        <label htmlFor='license-input' style={{ display: 'block' }}>License</label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type='text'
            name='license'
            id='license-input'
            value={license}
            style={{ width: '100%' }}
            onChange={(e) => { setLicense(e.target.value) }}
            pattern='^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
            required
          />
          {isValid
            ? <FontAwesomeIcon
                icon={faCheckCircle}
                style={{
                  color: 'green',
                  width: '20px',
                  transform: 'translateX(-28px)'
                }}
              />
            : <FontAwesomeIcon
                icon={faXmarkCircle}
                className='text-red-400'
                style={{
                  color: 'red',
                  width: '20px',
                  transform: 'translateX(-28px)'
                }}
              />}

        </div>
        <MButton
          variant='contained'
          color='primary'
          sx={{
            marginTop: '14px'
          }}
          type='submit'
        >
          SAVE
        </MButton>
      </form>
    </Wrapper>
  )
}

export default EditLicense
