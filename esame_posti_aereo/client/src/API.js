const SERVER_URL = 'http://localhost:3001/api/';

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) // connection error
  });
}

const getDatiVolo = async (TipoVolo) => {
  return getJson(
    fetch(SERVER_URL + 'voli/' + TipoVolo +  '/dati', {
      method: 'GET',
      credentials: 'include'
    })
  )
};

const getPrenotazione = async (tipoVolo) => {
  return getJson(
      fetch(SERVER_URL + 'voli/'+ tipoVolo +'/prenota', { 
          method: 'GET',
          credentials: 'include'
      })
  )
};

const nuovaPrenotazioneAuto = async(TipoVolo, N) => {
  return getJson(
      fetch(SERVER_URL + 'voli/' + TipoVolo + '/auto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
          N: parseInt(N)
      })
  })
  )
}

const nuovaPrenotazioneManuale = async(TipoVolo, postiRichiesti) => {
  return getJson(
    fetch(SERVER_URL + 'voli/' + TipoVolo +'/man' , {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ posti: postiRichiesti })
  })
  )
};

const cancellaPrenotazione = async(TipoVolo) => {
  return getJson(
    fetch(SERVER_URL + 'voli/' + TipoVolo + '/cancella', {
      method: 'DELETE',
      credentials: 'include'
  })
  )
}

/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
   */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
    body: JSON.stringify(credentials),
  })
  )
};
  
/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + 'sessions/current', {
    // this parameter specifies that authentication cookie must be forwarded
    credentials: 'include'
  });

  if (response.ok) {
    const userInfo = await response.json();
    return { ...userInfo}; // Include the user ID in the returned object
  } else {
    const error = await response.json();
    throw error;
  }
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
  })
  )
}

const API = {logIn, getUserInfo, logOut, getPrenotazione, cancellaPrenotazione, nuovaPrenotazioneManuale, nuovaPrenotazioneAuto, getDatiVolo};
export default API;
  