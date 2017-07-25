import React from 'react'
import Icon from './Icon'
import './Header.css'


export default function Header () {
  return <div className="Header">
    <h1><Icon name="decentraland" /> Decentraland</h1>
    <h2>A virtual world that runs on open standards</h2>
  </div>
}
