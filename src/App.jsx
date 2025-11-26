import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home'
import Menu from './components/Menu'
import Order from './components/Order'
import Performance from './components/Performance'  
function App() {

  return (
    <Router>
      <Routes>
        <Route
          path='/'
          element={<Login />} />

        <Route
          path="/home"
          element={<Home />} />

        <Route
          path='/menu'
          element={<Menu />} />

        <Route
          path='/orders'
          element={<Order />} />
        <Route
        path = "/performance"
        element = {<Performance />} />
      </Routes>

    </Router>
  )
}

export default App
