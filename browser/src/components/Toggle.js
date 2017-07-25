import React from 'react'
import PropTypes from 'prop-types'
import './Toggle.css'


export default function Toggle({ active, onChange }) {
  return <div className="Toggle">
    <span>Toggle</span>

    <input type="checkbox" id="_switch" checked={ active } onChange={ onChange } />

    <label htmlFor="_switch">Toggle</label>
  </div>

}

Toggle.propTypes = {
  active: PropTypes.bool,
  onChange: PropTypes.func
}

