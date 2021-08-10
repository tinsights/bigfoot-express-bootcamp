/* eslint-disable no-use-before-define */
import express from 'express';
import {
  read, add, edit, write,
} from './jsonFileStorage.js';

const app = express();
// set ejs as the view engine, default folder ./views/
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
setTimeout(() => {
  // GET method routers
  app.get('/', landingPage);
  app.get('/all', listSightings);
  app.get('/sightings/:index', sightingByIndex);
  // comfortable / more comfortable
  app.get('/year-sightings/:year?', sightingsByYear);
  // submit page and post functions
  app.get('/submit', submitSighting);
  app.post('/submit', submitSighting);
  // unnecessary
  app.get('/random', randomSighting);

  // this line is only reached if and only if no other
  // app.get event loop fires. i.e. for any route not defined.
  app.use((req, res) => {
    res.status(404).send('404 NOT FOUND');
  });

  app.listen(3004);
}, 0);

// one-off cleaning of data.json
// read('data.json', (err, jsonObj) => {
//   const { sightings } = jsonObj;
//   // sorts by current report number
//   sightings.sort((a, b) => (Number(a.REPORT_NUMBER) - Number(b.REPORT_NUMBER)));
//   // re-writes report number with index number
//   sightings.forEach((sighting, index) => {
//     sighting.REPORT_NUMBER = index + 1;
//   });
//   const sortedData = {
//     sightings,
//   };
//   write('data.json', sortedData, (err, jsonStr) => {});
// });

// landing page
const landingPage = (req, res) => {
  res.render('index');
};
const listSightings = (req, res) => {
  read('data.json', (err, jsonObj) => {
    if (err) throw err;
    // get sightings array from JSON
    const { sightings } = jsonObj;
    console.log('req.query :>> ', req.query);
    switch (req.query.sortBy) {
      case ('year'):
        if (req.query.order === 'asc') {
          sightings.sort((a, b) => (Number(b.YEAR) - Number(a.YEAR)));
        } else {
          sightings.sort((a, b) => (Number(a.YEAR) - Number(b.YEAR)));
        }
        break;
      case ('state'):
        if (req.query.order === 'asc') {
          sightings.sort((a, b) => (b.STATE <= a.STATE ? -1 : 1));
        } else {
          sightings.sort((a, b) => (a.STATE <= b.STATE ? -1 : 1));
        }
        break;
      default:
        sightings.sort((a, b) => (Number(a.REPORT_NUMBER) - Number(b.REPORT_NUMBER)));
    }

    const content = {
      title: 'Bigfoot Sightings',
      header: 'All Bigfoot Sightings',
      sightings,
    };
    res.render('all', content);
  });
};

// /sightings/:index
// function that returns one specific sighting if it exists
const sightingByIndex = (req, res) => {
  read('data.json', (err, jsonObj) => {
    if (err) throw err;
    // get sightings array from JSON
    const { sightings } = jsonObj;
    // get index from url
    let desiredIndex = req.params.index;
    console.log('desiredIndex :>> ', desiredIndex);
    if (desiredIndex === 'new-sighting') {
      desiredIndex = sightings.length;
      console.log('desiredIndex :>> ', desiredIndex);
    }
    // check if index exists
    if (desiredIndex <= sightings.length) {
      const content = {
        title: 'Bigfoot Sightings',
        sighting: sightings[desiredIndex - 1],
      };
      res.render('sighting', content);
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
    const sightingsArray = jsonObj.sightings;
    // get year from url
    // leaving it as string for comparison with value in JSON.
    // taking in either /:year or ?year=, whichever exists
    const desiredYear = req.query.year || req.params.year;
    let results = [];
    if (!desiredYear) {
      // if no year specified, return the entire database
      results = [...sightingsArray];
    }
    else {
    // get array of sightings from required year
    // will be incomplete list as some sightings have
    // "YEAR: early 1990s" or "YEAR: 2000/01"
    // tried using .includes() but couldn't get it to work - must be another way
      results = sightingsArray.filter((sighting) => sighting.YEAR === desiredYear);
    }
    // send results back only if any exists
    if (results.length > 0) {
      // half assed attempt at sorting
      // not the best, default isn't exactly alphabetical.
      switch (req.query.sort) {
        case ('asc'):
          results.sort((a, b) => (Number(a.YEAR) - Number(b.YEAR)));
          break;
        case ('desc'):
          results.sort((a, b) => (Number(b.YEAR) - Number(a.YEAR)));
          break;
        default:
          results.sort((a, b) => (a.STATE <= b.STATE ? 1 : -1));
          break;
      }
      // is there a more concise way of doing this?
      const content = {
        title: 'Bigfoot Sightings',
        header: 'Sightings by Year',
        sightings: results,
      };
      res.render('year', content);
    }
    else {
      // 400 BAD REQUEST
      res.status(400).send('No sightings for that year.');
    }
  });
};

const submitSighting = (req, res) => {
  switch (req.method) {
    case ('GET'):
      res.render('submit');
      break;
    case ('POST'):
      console.log('req.body :>> ', req.body);
      add('data.json', 'sightings', req.body, (err) => {
        if (err) {
          res.status(500).send('DB write error.');
        }
        // redirect to new sighting
        // wont work for multiple submissions at the same time
        res.redirect('/sightings/new-sighting');
      });
      break;
    default:
      res.status(503).send('Internal Service Error');
      console.log(res.method);
  }
};

const randomSighting = (req, res) => {
  read('data.json', (err, jsonObj) => {
    const { sightings } = jsonObj;
    const random = Math.floor(Math.random() * sightings.length) + 1;
    res.redirect(`/sightings/${random}`);
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
