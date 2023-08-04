import React from 'react'
import { createRoot } from 'react-dom/client'
import Content from './Content'
import content from '!!raw-loader!../css/content.css'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { createTheme, ThemeProvider } from "@mui/material/styles"
const contentStyles = document.createElement('style')

contentStyles.textContent = content

const emotionRoot = document.createElement('style')

const shadowHost = document.createElement('div')
const shadow = shadowHost.attachShadow({ mode: 'open' })
document.body.appendChild(shadowHost)
const reactRoot = document.createElement('div')
reactRoot.id = 'content-react'
shadow.appendChild(contentStyles)
shadow.appendChild(emotionRoot)
shadow.appendChild(reactRoot)

export const myCache = createCache({
  key: 'purity-vision-css',
  prepend: true,
  container: emotionRoot
})

const shadowTheme = createTheme({
  components: {
    MuiPopover: {
      defaultProps: {
        container: reactRoot
      }
    },
    MuiPopper: {
      defaultProps: {
        container: reactRoot
      }
    },
    MuiModal: {
      defaultProps: {
        container: reactRoot
      }
    }
  }
})

createRoot(reactRoot).render(
  <CacheProvider value={myCache}>
    <ThemeProvider theme={shadowTheme}>
      <Content />
    </ThemeProvider>
  </CacheProvider>
)

