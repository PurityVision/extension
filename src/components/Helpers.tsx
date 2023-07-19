import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { css, keyframes } from '@emotion/react'
import styled from '@emotion/styled'

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

export const FlexBox = styled(Box) <FlexBoxProps>`
  display: flex;
  gap: ${props => props.$gap !== undefined ? props.$gap : 0};
  direction: ${props => props.$direction !== undefined ? props.$direction : 'row'};
`

export const IconContainer = styled(Box)`
display: flex;
align-items: center;
`

interface IconProps {
  readonly $hoverColor?: string
}

export const Icon = styled(FontAwesomeIcon) <IconProps>`
  cursor: pointer;

  &:hover {
    color: ${props => props.$hoverColor !== undefined ? props.$hoverColor : ''}
  }
`

interface HoverFlexBoxProps extends FlexBoxProps {
  readonly $hoverColor?: string
}

export const HoverFlexBox = styled(FlexBox) <HoverFlexBoxProps>`
  align-items: center;
  cursor: pointer;

  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;

  &:hover {
    background-color: ${props => props.$hoverColor !== undefined ? props.$hoverColor : ''}
  }
`

// @keyframes bounce {
//     0%,to {
//         transform: translateY(-10%);
//         animation-timing-function: cubic-bezier(.8,0,1,1)
//     }

//     50% {
//         transform: none;
//         background-color: red;
//         animation-timing-function: cubic-bezier(0,0,.2,1)
//     }
// }

// animation: bounce 1s infinite;
// animation-duration: 1s;

export const SlideOut = keyframes`
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
`

interface SlideBoxProps {
  readonly $isExpanded: boolean
}

export const SlideBox = styled(Box) <SlideBoxProps>`
  width: ${props => props.$isExpanded ? '100%' : 0};
  animation: ${SlideOut} 2s ease-out forwards;
`

const SomeStyles = css`
  margin-top: 10px;
`

export const SomeThing = styled.div`
  ${SomeStyles}
  margin-bottom: 20px;
`

export const SlideUp = keyframes`
  0% {
    transform: translateY(60px);
  }

  100% {
    transform: none;
  }
  
`

export const SlideDown = keyframes`
  0% {
    transform: none;
  }

  100% {
    transform: translateY(60px);
  }
  
`
