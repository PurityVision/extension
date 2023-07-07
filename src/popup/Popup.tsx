import { FlexBox } from '@src/components/Helpers'
import { AppStorage } from '@src/worker'
import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import browser from 'webextension-polyfill'
import Switch from '@mui/material/Switch'

const Wrapper = styled.div`
  padding: 10px 20px;
  width: 220px;
`

const Title = styled.h1`
  font-size: 20px;
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
      <Title>Purity Vision Settings</Title>
      <FlexBox $gap='10px' style={{ alignItems: 'center' }}>
        <label htmlFor='pv-toggle-panel'>Show Control Panel?</label>
        <Switch
          id='pv-toggle-panel'
          checked={panelVisible}
          onChange={handleChangeVisible}
        />
      </FlexBox>
    </Wrapper>
  )
}

export default Popup
