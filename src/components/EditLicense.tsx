import React, { useEffect, useState } from 'react'
import Button from './Button'
import { getLicense } from '@src/api'
import { faCheckCircle, faXmarkCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import toast, { Toaster } from 'react-hot-toast'

interface AddLicenseProps {
  license: string
  setLicense: React.Dispatch<React.SetStateAction<string>>
  onSaveLicense: (license: string) => void
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

const AddLicense: React.FC<AddLicenseProps> = (
  { license, setLicense, onSaveLicense }
): JSX.Element => {
  const [isValid, setIsValid] = useState<boolean>(false)

  useEffect(() => {
    if (license === '') {
      return
    }
    validateLicense(license)
      .then(isValid => setIsValid(isValid))
      .catch(err => { console.error(err) })
  }, [])

  return (
    <div>
      <Toaster />
      <div className='mb-4'>
        <h1 className='text-2xl font-bold'>Your License</h1>
        <p>Enter your Purity Vision license</p>
        <a
          className='text-blue-400 underline'
          href={process.env.LANDING_PAGE_URL}
          target='_blank' rel='noreferrer'
        >
          Get your license
        </a>
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
        <label htmlFor='license-input' className='block'>License</label>
        <input
          type='text'
          name='license'
          id='license-input'
          className='px-4 py-2 rounded border mb-2 mr-2 w-3/4'
          value={license}
          onChange={(e) => { setLicense(e.target.value) }}
          pattern='^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$'
          required
        />
        {isValid
          ? <FontAwesomeIcon icon={faCheckCircle} className='text-green-400' />
          : <FontAwesomeIcon icon={faXmarkCircle} className='text-red-400' />}
        <Button
          className='block'
        >
          Save
        </Button>

      </form>
    </div>
  )
}

export default AddLicense
