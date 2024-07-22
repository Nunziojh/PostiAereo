import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import './App.css'
import { Container, Toast } from 'react-bootstrap/'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { React, useState, useEffect, useContext } from 'react';

import { Navigation } from './components/Navigation';
import { MainLayout, NotFoundLayout, PostiAereo, LoginLayout, LoadingLayout } from './components/PageLayout';

import MessageContext from './messageCtx';
import API from './API';

function App() {
  
  // This state contains the user's info.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const user = await API.getUserInfo();
        setUser(user);
        setLoggedIn(true);
      } catch (err) {
        setUser(null);
        setLoggedIn(false);
      }
    };
    checkLogin();
  }, []);


  // If an error occurs, the error message will be shown in a toast.
  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    else if (String(err) === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg); // WARN: a more complex application requires a queue of messages. In this example only last error is shown.
  }

  /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */ 
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setUser(null);
  };

  return (
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors }}>
        <Container fluid className="App">

          <Navigation logout={handleLogout} user={user} loggedIn={loggedIn} />

          <Routes>
            <Route path="/" element={loading ? <LoadingLayout /> : <Outlet />}>
              <Route index element={<Navigate replace to="/voli" />} />
              <Route path="/voli" element={<MainLayout />} />
              <Route path="/voli/locale" element={<PostiAereo loggedIn={loggedIn} TipoVolo={"locale"} />} />
              <Route path="/voli/regionale" element={<PostiAereo loggedIn={loggedIn} TipoVolo={"regionale"} />} />
              <Route path="/voli/internazionale" element={<PostiAereo loggedIn={loggedIn} TipoVolo={"internazionale"} />} />
              <Route path="*" element={<NotFoundLayout />} />
            </Route>
            <Route path="/login" element={!loggedIn ? <LoginLayout login={handleLogin} /> : <Navigate replace to={location.state?.from || '/'} />} />

            </Routes>
          <Toast show={message !== ''} onClose={() => setMessage('')} delay={4000} autohide bg="danger">
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        </Container>
      </MessageContext.Provider>
    </BrowserRouter>
  )
}

export default App
