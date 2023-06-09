import Content from './Content'
import React from 'react'
import ReactDOM from 'react-dom'

const reactRoot = document.createElement('div')
reactRoot.id = 'content-react'
document.body.appendChild(reactRoot)
console.log('loading menu panel')
ReactDOM.render(<Content />, document.getElementById('content-react'))
