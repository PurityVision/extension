import { COLORS } from '@src/constants'
import { styled } from 'styled-components'

// const primaryStyles = 'text-blue-800 border-blue-800 hover:bg-blue-100 transition-colors'
// const disabledStyles = 'disabled:border disabled:border-gray-400 disabled:text-gray-400'

const Button = styled.button`
  background: #ff3535;
  cursor: pointer;
  border-radius: 3px;
  border: none;
  padding: 7px 14px 7px 14px;
  color: white;

  &:hover {
    background: #f86868;
  }
`

export const BlueButton = styled(Button)`
  background: ${COLORS.blue};

  &:hover {
    background: #7ea6ff;
  }
`

export const GreenButton = styled(Button)`
  background: ${COLORS.green};

  &:hover {
    background: #81bd6f;
  }
`

export const SecondaryButton = styled(Button)`
  background: white;
  border: 1px solid gray;
  color: gray;

  &:hover {
    background: gray;
    color: white;
  }
`

export const PulseButton = styled(SecondaryButton)`
  @keyframes bounce {
      0%,to {
          animation-timing-function: cubic-bezier(.8,0,1,1)
      }

      50% {
          background-color: ${COLORS.red};
          animation-timing-function: cubic-bezier(0,0,.2,1)
      }
  }

  animation: bounce 1s infinite;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  animation-direction: normal;
  animation-fill-mode: none;
  animation-play-state: running;
  animation-name: bounce;
`

export default Button
