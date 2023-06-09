import { COLORS } from '@src/constants'
import React from 'react'
import { styled } from 'styled-components'

const StatusText = styled.p`
  color: ${COLORS.green};
`
const MenuStatus = (): JSX.Element => (
  <div>
    <StatusText>Site Enabled</StatusText>
    <p>Filtering: 10 images</p>
  </div>
)

export default MenuStatus
