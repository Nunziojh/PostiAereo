import { React, useContext, useState, useEffect } from 'react';
import { Row, Col, Button, Spinner, Form, Card, Container, ToggleButton, Modal,Toast  } from 'react-bootstrap';
import { Link, useParams, useLocation, Outlet } from 'react-router-dom';

import MessageContext from '../messageCtx';
import API from '../API';
import { LoginForm } from './Auth';
import '../App.css';
import { FaPlane } from 'react-icons/fa';
import { Navigation } from './Navigation';

//usata per la finestra di conferma prenotazione o cancellazione
function Finestra(props) {

  const handleClose = () => props.setShow(false);
  const handleShow = () => props.setShow(true);

  return (
    <>
      <Button variant={props.tipoBottone} disabled = { props.disabilita } onClick={handleShow}>
        {props.tasto}
      </Button>

      <Modal
        show={props.show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{props.titolo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {props.messaggio}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Annulla
          </Button>
          <Button variant="primary" onClick={props.handle}>Conferma</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function SelezioneVoli() {
  
    
  return (
    <Row xs={1} md={3} className="g-3 justify-content-center">
      {[{title:"Volo Locale",img:'http://localhost:3001/static/images/volo_locale.jpg',route:"/voli/locale"},
        {title:"Volo Regionale",img:'http://localhost:3001/static/images/volo_regionale.jpg',route:"/voli/regionale"},
        {title:"Volo Internazionale",img:'http://localhost:3001/static/images/volo_internazionale.jpg',route:"/voli/internazionale"}].map((e,idx) => (
        <Link to={e.route} key={idx}>
          <Col >
            <Card>
              <Card.Img variant="top" src={e.img} alt="Image"
                style={{ width: '350px', height: '200px' }}
                className="custom-image-class" />
              <Card.Body>
                <Card.Title>{e.title}</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        </Link>
      ))}
    </Row>
  );
}

function MainLayout() {

  return (
    <>
    <SelezioneVoli />
    </>
  );
}

function PostiAereo(props) {
 
  const [loading, setLoading] = useState(false);
  const [showPrenotazioneAuto, setShowPrenotazioneAuto] = useState(false);
  const [showPrenotazioneManuale, setShowPrenotazioneManuale] = useState(false);
  const [postiGiaPrenotati, setPostiGiaPrenotati] = useState([]);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  const [postiLiberi, setPostiLiberi] = useState(0);
  const [postiOccupati, setPostiOccupati] = useState(0);
  const [postiTotali, setPostiTotali] = useState(0);

  const [matrice, setMatrice] = useState([]);
  
  const [postiRichiesti, setPostiRichiesti] = useState([]);
  const [prenotazione, setPrenotazione] = useState(null);
  const [countPosti, setCountPosti] = useState(1);
  const [dirty, setDirty] = useState(false);

  const handlePrenotazioneAuto = () =>{ 
    if(showPrenotazioneAuto){
      setShowPrenotazioneAuto(false);
    }else{
      setShowPrenotazioneAuto(true);
      setShowPrenotazioneManuale(false);
    }
  };
  const handlePrenotazioneManuale = () => {
    if(showPrenotazioneManuale){
      setShowPrenotazioneManuale(false);
    }else{
      setShowPrenotazioneManuale(true);
      setShowPrenotazioneAuto(false);
    }
  };

  const handleInputChange = (event) => {
    const inputValue = parseInt(event.target.value);
    setCountPosti(Math.min(Math.max(inputValue, 1), postiLiberi));
  };

  // If an error occurs, the error message will be shown in a toast.
  const handleErrors = (err) => {
    let msg = '';
    if (err) msg = err;
    else if (String(err) === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg); // WARN: a more complex application requires a queue of messages. In this example only last error is shown.
  }

  const handleSubmitPrenotazioneAuto = (event) => {
    event.preventDefault();
    setDirty(true);
    setShow(false);
    API.nuovaPrenotazioneAuto(props.TipoVolo, countPosti)
    .then((response) => {
      setPostiGiaPrenotati([]);
        setPrenotazione(response);
        setCountPosti(1);
        setPostiRichiesti([]); 
      })
      .catch((error) => {
        if (Array.isArray(error)) {
          // Se la risposta è un vettore, significa che ci sono posti occupati
          setPrenotazione(null);
          setCountPosti(1);
          setPostiRichiesti([]);
          setPostiGiaPrenotati(error);
          // faccio rimanere visibili i posti gia' prenotati per 5 secondi
          setTimeout(() => {
            setPostiGiaPrenotati([]);
          }, 5000);
          error.length > 1 ? 
          handleErrors('I posti richiesti evidenziati in celeste sono già stati prenotati.') :
          handleErrors('Il posto richiesto evidenziato in celeste è già stato prenotato.');
        } else {
          // Altrimenti, la risposta contiene un errore
          setDirty(true);
          setCountPosti(1);
          setPostiRichiesti([]);
          setPrenotazione(null);
          setPostiGiaPrenotati([]);
          handleErrors(error);
        }
    });
  };
  
  const handleSubmitPrenotazioneManuale = (event) => {
    event.preventDefault();
    setDirty(true); //faccio aggiornare i valori della pagina
    setShow(false);
    API.nuovaPrenotazioneManuale(props.TipoVolo, postiRichiesti)
      .then((response) => {
        setPostiGiaPrenotati([]);
        setPrenotazione(response);
        setCountPosti(1);
        setPostiRichiesti([]); 
      })
      .catch((error) => {
        if (Array.isArray(error)) {
          // Se la risposta è un vettore, significa che ci sono posti occupati
          setPrenotazione(null);
          setCountPosti(1);
          setPostiRichiesti([]);
          setPostiGiaPrenotati(error);
          // faccio rimanere visibili i posti gia' prenotati per 5 secondi
          setTimeout(() => {
            setPostiGiaPrenotati([]);
          }, 5000);
          error.length > 1 ? 
          handleErrors('I posti richiesti evidenziati in celeste sono già stati prenotati.') :
          handleErrors('Il posto richiesto evidenziato in celeste è già stato prenotato.');
        } else {
          // Altrimenti, la risposta contiene un errore
          setDirty(true);
          setCountPosti(1);
          setPostiRichiesti([]);
          setPrenotazione(null);
          setPostiGiaPrenotati([]);
          handleErrors(error);
        }
      });
  };

  const handleCancel = (event) => {
    event.preventDefault();
    setDirty(true);
    setShow(false);
    API.cancellaPrenotazione(props.TipoVolo)
    .then(() => {
      setPrenotazione(null);
      setCountPosti(1);
      setPostiRichiesti([]);
      })
      .catch(e => {
        console.log(e);
        setCountPosti(1);
        setPostiRichiesti([]);
      });
  }

  useEffect(() => {
    setDirty(true);
  }, []);

  useEffect(() => {
    if (dirty) {
      setLoading(true);
      let timeout = null;
      const fetchPosti = async () => {
        try {
          timeout = setTimeout(async () => { //timer di due secondi per visuallizare bene il loading e per rendere più pulito il caricamento
          //chiamata al server per ottenere la matrice dei posti
          const { postiPrenotati,F, P} = await API.getDatiVolo(props.TipoVolo);
          const matriceLibera = Array(F).fill(Array(P).fill('Libero'));
          setPostiTotali(P * F);
          if(postiPrenotati!==null && postiPrenotati!==undefined && postiPrenotati.length!==0){
            const nuovaMatrice = matriceLibera.map((riga, indiceRiga) => {
              return riga.map((col, indiceCol) => {
                if (postiPrenotati.some(posto => posto.Fila === indiceRiga +1  && posto.Posto === indiceCol +1)) {
                  return 'Occupato';
                } else {
                  return col;
                }
              });
            });
            setMatrice(nuovaMatrice);
            setPostiOccupati(postiPrenotati.length);
            setPostiLiberi((P*F) - postiPrenotati.length);
          }else{
            setMatrice(matriceLibera);
            setPostiOccupati(0);
            setPostiLiberi((P*F));
          }
          if(props.loggedIn){
            const prenotation = await API.getPrenotazione(props.TipoVolo); //vettore di oggetti
            if(prenotation!==null && prenotation!==undefined && prenotation.length!==0){
              setPrenotazione(prenotation);
            }else{
              setPrenotazione(null);
            }
          }
          setLoading(false);
          setDirty(false);
        }, 500);
        } catch (err) {
          console.log(err);
          setDirty(false);
          setLoading(false);
        }
      };
      fetchPosti();
      return () => clearTimeout(timeout);
    }
  }, [dirty]);

  const handleSelect = (indiceRiga, indiceCol) => {
    const updatedMatrice = matrice.map((riga, r) =>
      riga.map((col, c) => {
        if (r === indiceRiga && c === indiceCol) {
          if (col === 'Libero') {
            setPostiRichiesti([...postiRichiesti, { Fila: r+1,Posto: c+1 }]);
            setPostiLiberi(postiLiberi - 1);
            return 'Selezionato';
          } else if (col === 'Selezionato') {
            const updatedPostiRichiesti = postiRichiesti.filter(
              posto => posto.Fila !== r+1 || posto.Posto !== c+1
            );
            setPostiRichiesti(updatedPostiRichiesti);
            setPostiLiberi(postiLiberi + 1);
            return 'Libero';
          }
        }
        return col;
      })
    );
  
    setMatrice(updatedMatrice);
  };

  const rigaPosti = () => {
    return matrice.map((riga, indiceRiga) => (
      <Row key={indiceRiga}>
        
          {riga.map((col, indiceCol) => (
            <Col key={`${indiceRiga}-${indiceCol}`} md={2}>
            
              <Button 
                className='seat' 
                variant={
                  (prenotazione !== null && prenotazione.some((posto) => posto.Fila === indiceRiga + 1 && posto.Posto === indiceCol + 1))
                    ? 'primary'
                    : postiGiaPrenotati.some((posto) => posto.Fila === indiceRiga + 1 && posto.Posto === indiceCol + 1)
                    ? 'info'
                    : col === 'Occupato'
                    ? 'danger'
                    : col === 'Selezionato'
                    ? 'warning'
                    : 'success'
                }
                disabled = {(col === 'Occupato'|| !props.loggedIn || !showPrenotazioneManuale) } 
                onClick={() => {if(col !== 'Occupato' && props.loggedIn && showPrenotazioneManuale) handleSelect(indiceRiga, indiceCol)}} >

                { indiceRiga+1 }{ String.fromCharCode(indiceCol+1 + 64) } 
              
              </Button>      
            
            </Col>
          ))}

      </Row>
    ));
  };

  return (
    <>
    {loading ? <LoadingLayout /> :
    <MessageContext.Provider value={{ handleErrors }}>
    <Container className='below-nav'>
      <Row>
        <Col xs={1}>
        <Link to='/voli'>
          <Button variant='secondary'>Indietro</Button>
        </Link>
        </Col>
        <Col className="text-center">
          <h2 >Volo {props.TipoVolo}</h2>
        </Col>
      </Row>
    <hr />

    <div>
    <table>
    <thead>
      </thead>
      <tbody>
        <tr>
        <td><b>Posti liberi:</b></td>
        <td className="table-value">{postiLiberi}</td>
        <td><b>Posti occupati:</b></td>
        <td className="table-value">{postiOccupati}</td>
        <td><b>Posti totali:</b></td>
        <td className="table-value">{postiTotali}</td>
        </tr>
    </tbody>
  </table>
  </div>

  <hr />

        <Row>
        <Col md={5} xs={3} className={"seats"}>
        <Container>
            {rigaPosti()}
        </Container>
        </Col>
        <Col>
        
        </Col>
        <Col md={5} xs={7}>
        {!props.loggedIn ? <></> : prenotazione!==null ? 
        
            <Finestra tasto="Cancella Prenotazione" messaggio="Sei sicuro di voler cancellare la prenotazione?" titolo="Cancella Prenotazione" handle={handleCancel} tipoBottone="danger" show={show} setShow={setShow} disabilita={false}/>
            : 
            <>
                <Row>
                  <Col>
                <ToggleButton className="mb-2" id="toggle-check" type="checkbox" variant="outline-primary" checked={showPrenotazioneAuto} value="1" onClick={handlePrenotazioneAuto}>
                  Prenotazione Automatica
                </ToggleButton>
                </Col>
                <Col>
                <ToggleButton className="mb-2" id="toggle-check" type="checkbox" variant="outline-primary" checked={showPrenotazioneManuale} value="1" onClick={handlePrenotazioneManuale}>
                  Prenotazione Manuale
                </ToggleButton>
                </Col>
                </Row>
                <span className="button-spacing" />
                <div>
                  {
                    showPrenotazioneAuto ? 
                    <Card>
                    <Card.Body>
                    <Form onSubmit={handleSubmitPrenotazioneAuto}>
                      <Form.Group className='mb-3'>
                          <Form.Label className="h4">Numero di posti: </Form.Label>
                          <Form.Control type="number" name="score" min={1} max={postiLiberi} value={countPosti} onChange={handleInputChange} />
                      </Form.Group> 
                      <Finestra tasto="Invia richiesta" messaggio="Sei sicuro di voler inviare la richiesta?" titolo="Prenotazione automatica" handle={handleSubmitPrenotazioneAuto} tipoBottone="primary" show={show} setShow={setShow} disabilita={false} />
                    </Form>
                    </Card.Body>
                    </Card>
                    :
                    <></>
                  }
                  {
                    showPrenotazioneManuale ?
                    <Card>
                    <Card.Body>
                    <Form onSubmit={handleSubmitPrenotazioneManuale}>
                      <Form.Group className='mb-3'>
                          <Form.Label className="h4">Numero posti selezionati: {postiRichiesti.length}</Form.Label>
                      </Form.Group>
                      <Finestra tasto="Invia richiesta" messaggio="Sei sicuro di voler inviare la richiesta?" titolo="Prenotazione manuale" handle={handleSubmitPrenotazioneManuale} tipoBottone="primary" show={show} setShow={setShow} disabilita={postiRichiesti.length===0 ? true : false}/>
                    </Form>
                    </Card.Body>
                    </Card>
                    :
                    <></>
                  }
            <Toast show={message !== ''} onClose={() => setMessage('')} delay={4000} autohide bg="danger">
              <Toast.Body>{message}</Toast.Body>
            </Toast>
          </div>
        </>
        }
           
  
  <div>
    <span className="spazio-colonne" />
  <table>
    <thead>
    </thead>
    <tbody>
      <tr>
        <td>
            <span className="button-spacing" /> 
            <span className="button-spacing" /> 
            <span className="button-spacing" /> 
            <span className="button-spacing" /> 
        </td>
      </tr>
      <tr>
        <td>
          <Button variant="success" disabled={true}></Button>
        </td>
        <td>Posto libero</td>
      </tr>
      <tr>
        <td>
          <Button variant="warning" disabled={true}></Button>
        </td>
        <td>Posto selezionato</td>
      </tr>
      <tr>
        <td>
          <Button variant="danger" disabled={true}></Button>
        </td>
        <td>Posto occupato</td>
      </tr>
      <tr>
        <td>
          <Button variant="primary" disabled={true}></Button>
        </td>
        <td>La mia prenotazione</td>
      </tr>
      <tr>
        <td>
          <Button variant="info" disabled={true}></Button>
        </td>
        <td>Posti richiesti prenotati</td>
      </tr>
      </tbody>
  </table>
</div>
            </Col>
        </Row>
    </Container>
    </MessageContext.Provider>
    }
    </>
  );
}

function NotFoundLayout() {
  return (
    <>
      <h2>Questa non e' la route che stai cercando!</h2>
      <Link to="/">
        <Button variant="primary">Go Home!</Button>
      </Link>
    </>
  );
}

/**
 * This layout shuld be rendered while we are waiting a response from the server.
 */
function LoadingLayout() {
  return (
    <Row className="text-center">

      <Col md={12} className="below-nav">
        <h1>
        <span className="scritte-spacing" />
        <span className="scritte-spacing" />
        <span className="scritte-spacing" />
        <span className="scritte-spacing" />
        <span className="scritte-spacing" />
          Caricamento in corso
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
        </h1>
        
      </Col>
    </Row>
  )
}

function LoginLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={12} className="below-nav">
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}

export { NotFoundLayout, MainLayout, PostiAereo, LoadingLayout, LoginLayout }; 
