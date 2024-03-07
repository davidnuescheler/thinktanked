let SAMPLE_BUNDLE;
let DOMAIN_KEY = '1234';
let DOMAIN = 'www.thinktanked.com';

async function loadSampleBundle() {
  const resp = await fetch('./sampleRUMBundle.json');
  return (resp.json());
}

async function createRandomBundle() {
  if (!SAMPLE_BUNDLE) {
    SAMPLE_BUNDLE = await loadSampleBundle();
    console.log(SAMPLE_BUNDLE);
  }
  const bundle = structuredClone(SAMPLE_BUNDLE);
  bundle.id = `${Math.random()}`;
  bundle.userAgent = Math.random() < 0.5 ? 'desktop' : 'mobile';
  return (bundle);
}

async function generateRandomRUMBundles(num) {
  const bundles = [];
  for (let i = 0; i < num; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const bundle = await createRandomBundle();
    bundles.push(bundle);
  }
  return (bundles);
}

async function fetchUTCHour(utcISOString) {
  const [date, time] = utcISOString.split('T');
  const datePath = date.split('-').join('/');
  const hour = time.split(':')[0];
  const apiRequestURL = `https://rum.hlx.page/${DOMAIN}/${datePath}/${hour}?domainKey=${DOMAIN_KEY}`;
  console.log(apiRequestURL);
  // const resp = await fetch(apiEndPoint);
  // const json = await resp.json();
  // const { rumBundles } = json;
  const rumBundles = await generateRandomRUMBundles(Math.random() * 1000);
  return { date, hour, rumBundles };
}

export function setDomain(domain, key) {
  DOMAIN = domain;
  DOMAIN_KEY = key;
}

export async function fetchLastWeek() {
  const timeSeries = [];
  const date = new Date();
  const hoursInWeek = 7 * 24;
  for (let i = 0; i < hoursInWeek; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    timeSeries.unshift(await fetchUTCHour(date.toISOString()));
    date.setHours(date.getHours() - 1);
  }
  return timeSeries;
}

async function draw() {
  const ctx = document.getElementById('myChart');

  const timeSeries = await fetchLastWeek();

  const labels = timeSeries.map((e) => `${e.hour}:00`);
  const data = timeSeries.map((e) => e.rumBundles.length * 100);
  // eslint-disable-next-line no-undef, no-new
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Page Views',
        data,
        barPercentage: 1,
        categoryPercentage: 0.95,
        backgroundColor: '#7FB2F0',
        hoverBackgroundColor: '#35478C',
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

draw();
