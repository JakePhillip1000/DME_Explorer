import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './static/pages/homePage.jsx'
import './static/css_styles/App.css'

function DmeExplorer() {
  return (
    <BrowserRouter>
      <Routes>
        {/* DME explorer homepage */}
        <Route path="/" element = {<Home />} />

        {/* Login page */}


        {/* Register Page --> Sign up*/}
        

        {/* About Page */}


        {/* Program and Education */}


        {/* Tuition and fee */}


        {/* Projects and competitions */}


        {/* occupation */}


        {/* contact information */}


        {/* 3d relax zone*/}

      </Routes>
    </BrowserRouter>
  )
}

export default DmeExplorer