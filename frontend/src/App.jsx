import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './static/pages/homePage.jsx';
import { NavigationBar } from './static/pages/components/navBar.jsx';
import { Register } from './static/pages/register.jsx';
import { Login } from './static/pages/login.jsx';

import './static/css_styles/App.css'

export function DmeExplorer() {
  return (
    <BrowserRouter>
      <Routes>
        {/* DME explorer homepage */}
        <Route path="/" element = {<Home />} />

        {/* Login page */}
        <Route  path="/login" element = {<Login />} />

        {/* Register Page --> Sign up*/}
        <Route path="/register" element = {<Register />} />

        {/* About Page */}


        {/* Program and Education */}


        {/* Tuition and fee */}


        {/* Projects and competitions */}


        {/* occupation */}


        {/* contact information */}


        {/* 3d relax zone*/}

        
        {/* Navigation Bar */}
        <Route path = "/navbar" element = {<NavigationBar />} />

      </Routes>
    </BrowserRouter>
  )
}
