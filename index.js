import express from 'express';
import { read } from './jsonFileStorage.js';

const app = express();
// set ejs as the view engine, default folder ./views/
app.set('view engine', 'ejs');

setTimeout(() => {
  // GET method routers
  app.get('/', landingPage);
  app.get('/sightings/:index', sightingByIndex);
  // comfortable / more comfortable
  app.get('/year-sightings/:year?', sightingsByYear);

  // this line is only reached if and only if no other
  // app.get event loop fires. i.e. for any route not defined.
  app.use((req, res) => {
    res.status(404).send('404 NOT FOUND');
  });

  app.listen(3004);
}, 0);

// landing page
const landingPage = (req, res) => {
  read('data.json', (err, jsonObj) => {
    if (err) throw err;
    // get sightings array from JSON
    const { sightings } = jsonObj;
    // wanted to sort sighting by report number, but figured will just link to index sigh.
    // sightings.sort((a, b) => (Number(a.REPORT_NUMBER) - Number(b.REPORT_NUMBER)));
    const content = {
      title: 'Bigfoot Sightings',
      header: 'All Bigfoot Sightings',
      sightings,
    };
    res.render('index', content);
  });
};

// function that returns one specific sighting if it exists
const sightingByIndex = (req, res) => {
  read('data.json', (err, jsonObj) => {
    if (err) throw err;
    // get sightings array from JSON
    const sightingArray = jsonObj.sightings;
    // get index from url
    const desiredIndex = req.params.index - 1;
    // check if index exists
    if (desiredIndex < sightingArray.length) {
      const sighting = sightingArray[req.params.index];
      // using +desiredIndex below for sneaky change to Number from String.
      const content = `
                        <html>
                          <body>
                            <h1>BIGFOOT SIGHTINGS</h1>
                            <h2>SIGHTING No. ${+desiredIndex}
                            <div>
                              <p>YEAR: ${sighting.YEAR}</p>
                              <p>STATE: ${sighting.STATE}</p>
                              <p>OBSERVED BY: ${sighting.OBSERVED}
                          </body>
                        </html>
                      `;
      res.send(content);
    } else {
      // 400 notti notti request
      res.status(400).send('No such sighting');
    }
  });
};

// COMFORTABLE
// function that returns a /year-sightings/:year request
// MORE COMFORTABLE
// if no year specified, returns entire database sorted by STATE
// sorts by asc/desc if query specified.
const sightingsByYear = (req, res) => {
  read('data.json', (err, jsonObj) => {
    if (err) throw err;
    // get sightings array from JSON
    const sightingArray = jsonObj.sightings;
    console.log(sightingArray.length);
    // get year from url
    // leaving it as string for comparison with value in JSON.
    const desiredYear = req.params.year;
    let results = [];
    if (!desiredYear) {
      // if no year specified, return the entire database
      results = [...sightingArray];
    }
    else {
    // get array of sightings from required year
    // will be incomplete list as some sightings have
    // "YEAR: early 1990s" or "YEAR: 2000/01"
    // tried using .includes() but couldn't get it to work - must be another way
      results = sightingArray.filter((sighting) => sighting.YEAR === desiredYear);
    }
    // send results back only if any exists
    if (results.length > 0) {
      // is there a more concise way of doing this?
      const content = results.map((sighting) => ({
        YEAR: sighting.YEAR,
        STATE: sighting.STATE,
      }));
      // half assed attempt at sorting
      // not the best, default isn't exactly alphabetical.
      switch (req.query.sort) {
        case ('asc'):
          content.sort((a, b) => (Number(a.YEAR) - Number(b.YEAR)));
          break;
        case ('desc'):
          content.sort((a, b) => (Number(b.YEAR) - Number(a.YEAR)));
          break;
        default:
          content.sort((a, b) => (a.STATE <= b.STATE ? 1 : -1));
          break;
      }
      console.log(content.length);
      res.send(content);
    }
    else {
      // 400 BAD REQUEST
      res.status(400).send('No sightings for that year.');
    }
  });
};

/* Was attempting to clean up data.json, but gave up when i saw the num of duplicates

const findDuplicates = (arr) => {
    // JS by default uses a crappy string compare.
    // (we use slice to clone the array so the
    // original array won't be modified)
    const results = [];
    for (let i = 0; i < arr.length - 1; i++) {
      if ((arr[i + 1] == arr[i]) && !results.some((el) => el === arr[i])) {
        results.push(arr[i]);
      }
    }
    return results;
  };

  const reportNumbers = sightings.map((sighting) => sighting.REPORT_NUMBER);
    console.log(findDuplicates(reportNumbers));

*/
