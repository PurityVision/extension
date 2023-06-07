import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { styled } from 'styled-components'

interface BoxProps {
  readonly $padding?: string
  readonly $margin?: string
  readonly $border?: string
  readonly $borderRadius?: string
}

interface FlexBoxProps extends BoxProps {
  readonly $gap?: string
  readonly $direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
}

export const Box = styled.div<BoxProps>`
  padding: ${props => props.$padding !== undefined ? props.$padding : 0};
  margin: ${props => props.$margin !== undefined ? props.$margin : 0};
  border: ${props => props.$border !== undefined ? props.$border : ''};
  border-radius: ${props => props.$borderRadius !== undefined ? props.$borderRadius : ''};
`

export const FlexBox = styled(Box)<FlexBoxProps>`
  display: flex;
  gap: ${props => props.$gap !== undefined ? props.$gap : 0};
  direction: ${props => props.$direction !== undefined ? props.$direction : 'row'};
`

interface IconProps {
  readonly $hoverColor?: string
}

export const Icon = styled(FontAwesomeIcon)<IconProps>`
  cursor: pointer;

  &:hover {
    color: ${props => props.$hoverColor !== undefined ? props.$hoverColor : ''}
  }
`

interface HoverFlexBoxProps extends FlexBoxProps {
  readonly $hoverColor?: string
}

export const HoverFlexBox = styled(FlexBox)<HoverFlexBoxProps>`
  align-items: center;
  cursor: pointer;

  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  &:hover {
    background-color: ${props => props.$hoverColor !== undefined ? props.$hoverColor : ''}
  }
`
