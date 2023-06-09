import { FlexBox } from '@src/components/Helpers'
import { AppStorage } from '@src/worker'
import React, { useEffect, useState } from 'react'
import { styled } from 'styled-components'
import browser from 'webextension-polyfill'

const Wrapper = styled.div`
  padding: 2rem;
  width: 220px;
`

const Popup = (): JSX.Element => {
  const [panelVisible, setPanelVisible] = useState(false)

  useEffect(() => {
    const init = async (): Promise<void> => {
      const storage = await browser.storage.local.get() as AppStorage
      setPanelVisible(storage.panelVisible)
    }
    void init()
  }, [])

  const handleChangeVisible = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const panelVisible = e.target.checked
    const updateStorage = async (): Promise<void> => {
      try {
        await browser.storage.local.set({ panelVisible })
      } catch (err) {
        console.error('failed to update storage: ', err)
      }
    }

    void updateStorage()
    setPanelVisible(panelVisible)
  }

  return (
    <Wrapper>
      <FlexBox $gap='10px' style={{ alignItems: 'center' }}>
        <label htmlFor='show-controls-toggle'>Show Control Panel?</label>
        <input
          checked={panelVisible}
          onChange={handleChangeVisible}
          type='checkbox'
          id='show-controls-toggle'
        />

      </FlexBox>
    </Wrapper>
  )
}

export default Popup
