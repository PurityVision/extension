import * as React from 'react'
import * as ReactDOM from 'react-dom'
import browser from 'webextension-polyfill'
import Popup from './Popup'

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(<Popup />, document.getElementById('popup'))
}).catch(err => console.log(err))
