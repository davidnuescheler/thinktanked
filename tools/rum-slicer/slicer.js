let SAMPLE_BUNDLE;
let DOMAIN_KEY = '1234';
let DOMAIN = 'www.thinktanked.com';

const filterInput = document.getElementById('filter');
const canvas = document.getElementById('myChart');
let dataChunks = [];

// eslint-disable-next-line no-undef, no-new
const chart = new Chart(canvas, {
  type: 'bar',
  data: {
    labels: ['this'],
    datasets: [{
      label: 'Page Views',
      data: [2000],
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

async function loadSampleBundle() {
  const resp = await fetch('./sampleRUMBundle.json');
  return (resp.json());
}

async function createRandomBundle(date, hour) {
  if (!SAMPLE_BUNDLE) {
    SAMPLE_BUNDLE = await loadSampleBundle();
  }
  const sampleURLs = ['https://www.thinktanked.org/', 'https://www.thinktanked.org/pretzels', 'https://www.thinktanked.org/iba-testing'];
  const bundle = structuredClone(SAMPLE_BUNDLE);
  bundle.id = `${Math.random()}`;
  bundle.userAgent = Math.random() < 0.5 ? 'desktop' : 'mobile';
  bundle.url = sampleURLs[Math.floor(Math.random() * 3)];
  bundle.timeSlot = `${date}T${hour}:00:00Z`;
  return (bundle);
}

async function generateRandomRUMBundles(num, date, hour) {
  const bundles = [];
  for (let i = 0; i < num; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const bundle = await createRandomBundle(date, hour);
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
  const rumBundles = await generateRandomRUMBundles(Math.random() * 100, date, hour);
  return { date, hour, rumBundles };
}

export function setDomain(domain, key) {
  DOMAIN = domain;
  DOMAIN_KEY = key;
}

export async function fetchLastWeek() {
  const chunks = [];
  const date = new Date();
  const hoursInWeek = 7 * 24;
  for (let i = 0; i < hoursInWeek; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    chunks.unshift(await fetchUTCHour(date.toISOString()));
    date.setHours(date.getHours() - 1);
  }
  return chunks;
}

function filterBundle(bundle, filter) {
  let matched = true;
  if (!bundle.url.includes(filter.text)) {
    matched = false;
  }
  return (matched);
}

function createChartData(bundles, config) {
  const labels = [];
  const data = [];
  if (config.view === 'previousWeek') {
    const hoursInWeek = 7 * 24;
    const counts = {};

    bundles.forEach((bundle) => {
      if (!counts[bundle.timeSlot]) counts[bundle.timeSlot] = 0;
      counts[bundle.timeSlot] += bundle.weight;
    });

    const date = new Date();
    for (let i = 0; i < hoursInWeek; i += 1) {
      const [dateString, time] = date.toISOString().split('T');
      const hour = time.split(':')[0];
      const timeSlot = `${dateString}T${hour}:00:00Z`;

      labels.unshift(`${hour}:00`);
      data.unshift(counts[timeSlot]);
      date.setHours(date.getHours() - 1);
    }
  }

  return { labels, data };
}

async function draw() {
  const filtered = [];
  const filter = {
    text: filterInput.value,
  };
  dataChunks.forEach((chunk) => {
    filtered.push(...chunk.rumBundles.filter((bundle) => filterBundle(bundle, filter)));
  });
  const { labels, data } = createChartData(filtered, { view: 'previousWeek' });
  chart.data.datasets[0].data = data;
  chart.data.labels = labels;
  chart.update();
}

async function loadData() {
  dataChunks = await fetchLastWeek();
  draw();
}

loadData();
filterInput.addEventListener('input', draw);
