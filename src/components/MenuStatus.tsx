import { COLORS } from '@src/constants'
import React from 'react'
import styled from '@emotion/styled'
import { FlexBox } from './Helpers'
import CircularProgress from '@mui/material/CircularProgress'

export type MenuStatusState = 'loading' | 'active' | 'invalid license' | undefined

interface MenuStatusProps {
  state: MenuStatusState
  count?: number
}

// const ActiveText = styled.p`
//   color: ${COLORS.green};
//   margin: 0 !important;
// `
const DisabledText = styled.p`
  color: ${COLORS.red};
  margin: 0 !important;
`

const NoSpaceP = styled.p`
  margin: 0 !important;
`

const MenuStatusContainer = styled.div`
  border: 1px solid ${COLORS.gray};
  border-width: 0 1px 0 1px;
  padding: 0 10px;
  display: flex;
  text-transform: uppercase;
  font-size: 14px;
  align-items: center;
`

const MenuStatus = ({ state, count }: MenuStatusProps): JSX.Element => {
  switch (state) {
    case 'loading':
      return (
        <MenuStatusContainer>
          <FlexBox $gap='10px' style={{ alignItems: 'center' }}>
            <span>Running Filter</span>
            <CircularProgress />
          </FlexBox>
        </MenuStatusContainer>
      )
    case 'active':
      return (
        <MenuStatusContainer>
          <div>
            <NoSpaceP>{count} NSFW images</NoSpaceP>
          </div>
        </MenuStatusContainer>
      )
    case 'invalid license':
      return (
        <MenuStatusContainer>
          <FlexBox style={{ alignItems: 'center' }}>
            <DisabledText>Invalid License</DisabledText>
          </FlexBox>
        </MenuStatusContainer>
      )
    default: {
      return <></>
    }
  }
}

export default MenuStatus
