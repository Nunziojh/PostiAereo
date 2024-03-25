'use strict';

/* Data Access Object (DAO) module for accessing users data */

const db = require('./db');
const crypto = require('crypto');

exports.listaPosti = (TipoVolo) => {
  return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM Posti WHERE TipoVolo=?';
      db.all(sql, TipoVolo, (err, rows) => {
      if (err) {
          reject(err);
      } else {
          const posti = rows.map((e) => ({
                Fila: e.Fila,
                Posto: e.Posto,
                TipoVolo: e.TipoVolo,
                Status: e.Status }));
          resolve(posti);
      }
      });
  });
};

exports.listaPostiOccupati = (TipoVolo) => {
  return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM Posti WHERE TipoVolo=? AND Status="Occupato"';
      db.all(sql, TipoVolo, (err, rows) => { 
      if (err) {
          reject(err);
      } else {
          const posti = rows.map((e) => ({
              Fila: e.Fila,
              Posto: e.Posto,
              TipoVolo: e.TipoVolo,
              Status: e.Status }));
          resolve(posti);
      }
      });
  });
};

exports.prenotazionePerVoloPerUtente = (UserID, TipoVolo) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Prenotazioni WHERE UserID=? AND TipoVolo=?';
        db.all(sql, [UserID, TipoVolo], (err, rows) => {
        if (err) {
            reject(err);
        } else {
            const prenotazioni = rows.map((e) => ({
                Fila: e.Fila,
                Posto: e.Posto
               }));
            resolve(prenotazioni);
        }
        });
    });
};

exports.primiNPostiLiberi = (TipoVolo, N) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Posti WHERE TipoVolo=? AND Status="Libero" LIMIT ?';
        db.all(sql, [TipoVolo, N], (err, rows) => {
        if (err) {
            reject(err);
        } else {
            const posti = rows.map((e) => ({
                 Fila: e.Fila,
                 Posto: e.Posto
                }));
            resolve(posti);
        }
        });
    });
}

exports.nuovaPrenotazione = (listaPostiSelezionati, UserID, TipoVolo) => {
  return new Promise((resolve, reject) => {
    const sql1 = 'SELECT * FROM Prenotazioni WHERE UserID = ? AND TipoVolo = ?';
    db.all(sql1, [UserID, TipoVolo], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.length > 0) {
          reject('L\'utente ha già una prenotazione per questo volo');
        } else {
          const sql2 = 'SELECT * FROM Posti WHERE TipoVolo = ? AND Fila = ? AND Posto = ? AND Status = "Occupato"';
          const postiOccupati = [];
          let counter = 0;
          for (const posto of listaPostiSelezionati) {
            db.all(sql2, [TipoVolo, posto.Fila, posto.Posto], (err, row) => {
              if (err) {
                reject(err);
              } else if (row.length > 0) {
                postiOccupati.push({ Fila: posto.Fila, Posto: posto.Posto });
              }
              counter++;
              if (counter === listaPostiSelezionati.length) {
                if (postiOccupati.length > 0) {
                  reject(postiOccupati);
                } else {
                  inserisciPrenotazione(resolve, reject, listaPostiSelezionati, UserID, TipoVolo);
                }
              }
            });
          }
        }
      }
    });
  });
};

function inserisciPrenotazione(resolve, reject, listaPostiSelezionati, UserID, TipoVolo) {
  const sql3 = 'INSERT INTO Prenotazioni(UserID, TipoVolo, Fila, Posto) VALUES (?, ?, ?, ?)';
  let counter = 0;
  for (const posto of listaPostiSelezionati) {
    db.run(sql3, [UserID, TipoVolo, posto.Fila, posto.Posto], (err) => {
      if (err) {
        reject(err);
      } else {
        counter++;
        if (counter === listaPostiSelezionati.length) {
          aggiornaPosti(resolve, reject, listaPostiSelezionati, TipoVolo);
        }
      }
    });
  }
}

function aggiornaPosti(resolve, reject, listaPostiSelezionati, TipoVolo) {
  const sql4 = 'UPDATE Posti SET Status = "Occupato" WHERE TipoVolo = ? AND Fila = ? AND Posto = ?';
  let counter = 0;
  for (const posto of listaPostiSelezionati) {
    db.run(sql4, [TipoVolo, posto.Fila, posto.Posto], (err) => {
      if (err) {
        reject(err);
      } else {
        counter++;
        if (counter === listaPostiSelezionati.length) {
          resolve(listaPostiSelezionati);
        }
      }
    });
  }
}

exports.cancellaPrenotazione = (UserID, TipoVolo) => {
    return new Promise((resolve, reject) => {
      //seleziono i posti prenotati dall'utente per poi metterli liberi nella tabella Posti
      const sql1 = 'SELECT Fila , Posto FROM Prenotazioni WHERE UserID=? AND TipoVolo=?';
      db.all(sql1, [UserID, TipoVolo], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const posti = rows.map((e) => ({
            Fila: e.Fila,
            Posto: e.Posto
          }));
          //elimino la prenotazione dell'utente
          const sql2 = 'DELETE FROM Prenotazioni WHERE UserID=? AND TipoVolo=?';
          db.run(sql2, [UserID, TipoVolo], (err) => {
            if (err) {
              reject(err);
            } else {
              //metto i posti liberi nella tabella Posti
              const sql3 = 'UPDATE Posti SET Status="Libero" WHERE TipoVolo=? AND Fila=? AND Posto=?';
              let counter = 0;
              for (const posto of posti) {
                db.run(sql3, [TipoVolo,  posto.Fila,posto.Posto], (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    counter++;
                    if (counter === posti.length) {
                      resolve();
                    }
                  }
                });
              }
            }
          });
        }
      });
    });
  }

exports.parametriVolo = (TipoVolo) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT File, Posti FROM Voli WHERE TipoVolo=?';
      db.get(sql, [TipoVolo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
};