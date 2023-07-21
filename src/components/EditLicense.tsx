import styled from '@emotion/styled'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import { Link } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import { getLicense } from '@src/api'
import { Button } from '@src/components/Button'
import { COLORS } from '@src/constants'
import React, { useEffect, useRef, useState } from 'react'
import { Severity } from './Alert'

interface AddLicenseProps {
  license: string
  setLicense: React.Dispatch<React.SetStateAction<string>>
  onSaveLicense: (license: string) => void
  onCloseHandler: any
  onAlert: (msg: string, severity: Severity) => void
}

const Wrapper = styled.div`
  padding: 14px;
  border-bottom: 1px solid ${COLORS.lightGray};
`

const TextSection = styled.div`
  margin-bottom: 30px;
`
const validateLicense = async (
  licenseID: string,
  onAlert: (msg: string, severity: Severity) => void
): Promise<boolean> => {
  const [license, err] = await getLicense(licenseID)
  if (err !== undefined) {
    // toast.error('Something went wrong')
    console.error('failed to fetch license: ', err)
    onAlert('Something went wrong', 'error')
    return false
  }

  if (license == null) {
    // toast.error('License was not found')
    onAlert('License was not found', 'error')
    return false
  }

  if (!license.isValid) {
    // toast.error('License has expired or is invalid')
    onAlert('License has expired or is invalid', 'error')
  }

  return license?.isValid
}


const EditLicense: React.FC<AddLicenseProps> = (
  { license, setLicense, onSaveLicense, onCloseHandler, onAlert }
): JSX.Element => {
  const [isValid, setIsValid] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (license === '') {
      return
    }
    if (inputRef !== null && inputRef.current?.validity.valid === false) {
      return
    }

    validateLicense(license, onAlert)
      .then(isValid => setIsValid(isValid))
      .catch(err => { console.error(err) })
  }, [license])

  return (
    <Wrapper>
      <TextSection>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ marginBottom: '5px', marginTop: '5px' }}>Your License</h2>
          <IconButton onClick={onCloseHandler}>
            <CloseIcon />
          </IconButton>
        </div>
        <p style={{ marginTop: 0, marginBottom: '5px' }}>Enter your Purity Vision license</p>
        <Link href={process.env.LANDING_PAGE_URL} target='_blank' rel='noreferrer'>Get a License</Link>
      </TextSection>
      <form onSubmit={e => {
        e.preventDefault()
        validateLicense(license, onAlert)
          .then(isValid => {
            setIsValid(isValid)

            if (isValid) {
              onSaveLicense(license)
            }
          })
          .catch(err => {
            console.error(err)
            // toast.error(err)
          })
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="License"
            variant="outlined"
            value={license}
            fullWidth
            onChange={(e) => { setLicense(e.target.value) }}
            inputProps={{
              pattern: '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
            }}
            required
          />

          {isValid
            ? <CheckCircleIcon
              style={{
                color: 'green',
                transform: 'translateX(-28px)',
                position: 'fixed',
                right: 0
              }}
            />

            : <CancelIcon
              className='text-red-400'
              style={{
                color: 'red',
                transform: 'translateX(-28px)',
                position: 'fixed',
                right: 0
              }}
            />}

        </div>
        <Button
          variant='contained'
          color='primary'
          sx={{
            marginTop: '14px'
          }}
          type='submit'
        >
          SAVE
        </Button>
      </form>
    </Wrapper >
  )
}

export default EditLicense
