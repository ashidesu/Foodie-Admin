import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home'
import Menu from './components/Menu'
import Order from './components/Order'
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
      </Routes>

    </Router>
  )
}

export default App
