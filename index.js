import express from 'express';
import { read } from './jsonFileStorage.js';

const app = express();

// generic landing page
const handleIncomingRequest = (request, response) => {
  console.log('request came in');
  response.send('yay');
};

const sightingByIndex = (req, res) => {
  read('data.json', (err, jsonObj) => {
    if (err) throw err;
    const sightingArray = jsonObj.sightings;
    const desiredIndex = req.params.index;
    if (desiredIndex < sightingArray.length) {
      const sighting = sightingArray[req.params.index];
      const content = `
                        <html>
                          <body>
                            <h1>BIGFOOT SIGHTINGS</h1>
                            <h2>SIGHTING No. ${+desiredIndex + 1}
                            <div>
                              <p>YEAR: ${sighting.YEAR}</p>
                              <p>STATE: ${sighting.STATE}</p>
                              <p>OBSERVED BY: ${sighting.OBSERVED}
                          </body>
                        </html>
                      `;
      res.send(content);
    } else {
      // 400 notti request
      res.status(400).send('No such sighting');
    }
  });
};

// GET method routers
app.get('/', handleIncomingRequest);
app.get('/sightings/:index', sightingByIndex);

// this line is only reached if and only if no other
// app.get event loop fires. i.e. for any route not defined.
app.use((req, res) => {
  res.status(404).send('404 NOT FOUND');
});

app.listen(3004);
