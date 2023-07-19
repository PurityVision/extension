if (process.env.API_URL === undefined) {
  throw new Error('API_URL must be defined in production mode')
}
const apiURL = process.env.API_URL

export async function annotateImages(imgURIs: string[], license: string): Promise<Response | undefined> {
  const url = `${apiURL}/filter/batch`
  const opts = {
    method: 'post',
    body: JSON.stringify({ imgURIList: imgURIs }),
    headers: {
      licenseID: license
    }
  }

  return await fetch(url, opts)
}

export async function health(): Promise<Response | undefined> {
  const url = `${apiURL}/health`
  try {
    return await fetch(url, {})
  } catch (err) {
    console.log('failed to fetch health: ', err)
  }
}

interface License {
  id: string
  email: string
  stripeID: string
  isValid: boolean
}

export async function getLicense(id: string): Promise<[License | undefined, Error | undefined]> {
  const url = `${apiURL}/license/${id}`
  try {
    const res = await fetch(url, {})
    return [await res.json() as License, undefined]
  } catch (err) {
    return [undefined, err as Error]
  }
}
