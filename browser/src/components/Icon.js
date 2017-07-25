import React from 'react'
import PropTypes from 'prop-types'
import './Icon.css'


export default function Icon({ name }) {
  let className = 'Icon'

  if (name) {
    className += ` Icon-${name}`
  }

  return <i className={ className } />
}

Icon.propTypes = {
  name: PropTypes.string
}
