import React, { useEffect, useState } from 'react'
import { styled } from 'styled-components'
import browser from 'webextension-polyfill'

const Wrapper = styled.div`
  padding: 2rem;
  width: 200px;
`

const Popup = (): JSX.Element => {
  const [panelVisible, setPanelVisible] = useState(false)

  useEffect(() => {
    // const init = async (): Promise<void> => {
    //   const storage = await browser.storage.local.get() as AppStorage
    //   setPanelVisible(storage.panelVisible)
    // }
    // void init()

    void browser.tabs.create({
      url: process.env.LANDING_PAGE_URL
    })
  }, [])

  const handleChangeVisible = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPanelVisible(e.target.checked)
  }

  return (
    <Wrapper>
      <label htmlFor='show-controls'>Hide Control Panel?</label>
      <br />
      <input
        checked={panelVisible}
        onChange={handleChangeVisible}
        type='checkbox'
        name='show-controls'
        id='show-controls-toggle'
      />
    </Wrapper>
  )
}

export default Popup
