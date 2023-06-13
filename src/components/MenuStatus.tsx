import { COLORS } from '@src/constants'
import React from 'react'
import styled from '@emotion/styled'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FlexBox } from './Helpers'

export type MenuStatusState = 'loading' | 'active' | 'off' | 'not whitelisted' | undefined

interface MenuStatusProps {
  state: MenuStatusState
  count?: number
}

const ActiveText = styled.p`
  color: ${COLORS.green};
  margin: 0 !important;
`
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
  align-items: center;
`

const Spinner = styled(FontAwesomeIcon)`
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  animation: spin 1s infinite linear;
`

const MenuStatus = ({ state, count }: MenuStatusProps): JSX.Element => {
  switch (state) {
    case 'loading':
      return (
        <MenuStatusContainer>
          <FlexBox $gap='10px' style={{ alignItems: 'center' }}>
            <span>Running Filter</span>
            <Spinner icon={faSpinner} />
          </FlexBox>
        </MenuStatusContainer>
      )
    case 'active':
      return (
        <MenuStatusContainer>
          <div>
            <ActiveText>Site Enabled</ActiveText>
            <NoSpaceP>{count} NSFW images</NoSpaceP>
          </div>
        </MenuStatusContainer>
      )
    case 'off':
      return (
        <MenuStatusContainer>
          <FlexBox style={{ alignItems: 'center' }}>
            <DisabledText>Filter Disabled</DisabledText>
          </FlexBox>
        </MenuStatusContainer>
      )
    case 'not whitelisted':
      return (
        <MenuStatusContainer>
          <FlexBox style={{ alignItems: 'center' }}>
            <DisabledText>Site not added</DisabledText>
          </FlexBox>
        </MenuStatusContainer>
      )
    default: {
      return <></>
    }
  }
}

export default MenuStatus
