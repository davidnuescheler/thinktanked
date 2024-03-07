let SAMPLE_BUNDLE;
let DOMAIN_KEY = '1234';
let DOMAIN = 'www.thinktanked.com';

const filterInput = document.getElementById('filter');
const facetsElement = document.getElementById('facets');
const canvas = document.getElementById('myChart');
let dataChunks = [];

// eslint-disable-next-line no-undef, no-new
const chart = new Chart(canvas, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Page Views',
      data: [],
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

function toHumanReadble(num) {
  const dp = 0;
  let number = num;
  const thresh = 1000;

  if (Math.abs(num) < thresh) {
    return `${num} B`;
  }

  const units = ['k', 'm', 'g', 't', 'p'];
  let u = -1;
  const r = 10 ** dp;

  do {
    number /= thresh;
    u += 1;
  } while (Math.round(Math.abs(number) * r) / r >= thresh && u < units.length - 1);

  return `${number.toFixed(dp)}${units[u]}`;
}

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
  bundle.userAgent = Math.random() < 0.3 ? 'desktop' : 'mobile';
  bundle.url = sampleURLs[Math.floor(Math.random() * 3)];
  bundle.timeSlot = `${date}T${hour}:00:00Z`;
  // remove leave
  if (Math.random() < 0.3) bundle.events.splice(6, 1);
  // remove enter
  if (Math.random() < 0.3) bundle.events.splice(3, 1);

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

function filterBundle(bundle, filter, facets) {
  let matchedAll = true;
  const filterMatches = {};

  filterMatches.text = true;
  if (!bundle.url.includes(filter.text)) {
    matchedAll = false;
    filterMatches.text = false;
  }

  const checkpoints = bundle.events.map((e) => e.checkpoint);

  /* filter checkpoint */
  if (matchedAll) {
    if (filter.checkpoint.length) {
      if (checkpoints.some((cp) => filter.checkpoint.includes(cp))) {
        filterMatches.checkpoint = true;
      } else {
        matchedAll = false;
        filterMatches.checkpoint = false;
      }
    }
  }

  /* filter url */
  if (matchedAll) {
    if (filter.url.length) {
      if (filter.url.includes(bundle.url)) {
        filterMatches.url = true;
      } else {
        matchedAll = false;
        filterMatches.url = false;
      }
    }
  }

  const matchedEverythingElse = (facetName) => {
    let includeInFacet = true;
    Object.keys(filterMatches).forEach((filterKey) => {
      if (filterKey !== facetName && !filterMatches[filterKey]) includeInFacet = false;
    });
    return includeInFacet;
  };

  /* facets */
  if (matchedEverythingElse('checkpoint')) {
    checkpoints.forEach((val) => {
      if (facets.checkpoint[val]) facets.checkpoint[val] += bundle.weight;
      else facets.checkpoint[val] = bundle.weight;
    });
  }

  if (matchedEverythingElse('url')) {
    if (facets.url[bundle.url]) facets.url[bundle.url] += bundle.weight;
    else facets.url[bundle.url] = bundle.weight;
  }

  return (matchedAll);
}

function createChartData(bundles, config) {
  const labels = [];
  const data = [];
  const facets = {
    checkpoint: {},
    target: {},
    url: {},
  };

  if (config.view === 'previousWeek') {
    const hoursInWeek = 7 * 24;
    const counts = {};

    bundles.forEach((bundle) => {
      if (!counts[bundle.timeSlot]) counts[bundle.timeSlot] = 0;
      counts[bundle.timeSlot] += bundle.weight;
      bundle.events.forEach((event) => {
        const addToFacet = (facetName) => {
          if (event[facetName]) {
            if (!facets[facetName][event[facetName]]) facets[facetName][event[facetName]] = 0;
            facets[facetName][event[facetName]] += bundle.weight;
          }
        };

        addToFacet('checkpoint');
        addToFacet('target');
        addToFacet('url');
      });
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

  return { labels, data, facets };
}

function updateFacets(facets) {
  const url = new URL(window.location);

  facetsElement.textContent = '';
  const keys = Object.keys(facets);
  keys.forEach((facetName) => {
    const facet = facets[facetName];
    const fieldSet = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = facetName;
    fieldSet.append(legend);
    const optionKeys = Object.keys(facet);
    optionKeys.sort((a, b) => facet[b] - facet[a]);
    optionKeys.forEach((optionKey) => {
      const optionValue = facet[optionKey];
      const div = document.createElement('div');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = optionKey;
      input.checked = url.searchParams.getAll(facetName).includes(optionKey);
      input.id = `${facetName}-${optionKey}`;
      input.addEventListener('click', () => {
        // eslint-disable-next-line no-use-before-define
        updateState();
        // eslint-disable-next-line no-use-before-define
        draw();
      });

      const label = document.createElement('label');
      label.for = `${facetName}-${optionKey}`;
      label.textContent = `${optionKey} (${toHumanReadble(optionValue)})`;
      div.append(input, label);
      fieldSet.append(div);
    });
    facetsElement.append(fieldSet);
  });
}

async function draw() {
  const params = new URL(window.location).searchParams;
  const checkpoint = params.getAll('checkpoint');
  const target = params.getAll('target');
  const url = params.getAll('url');

  const filterText = params.get('filter');
  const filtered = [];
  const filter = {
    text: filterText,
    checkpoint,
    target,
    url,
  };

  const facets = {
    checkpoint: {},
    url: {},
  };

  dataChunks.forEach((chunk) => {
    filtered.push(...chunk.rumBundles.filter((bundle) => filterBundle(bundle, filter, facets)));
  });
  const { labels, data } = createChartData(filtered, { view: 'previousWeek' });
  chart.data.datasets[0].data = data;
  chart.data.labels = labels;
  chart.update();
  updateFacets(facets);
}

async function loadData() {
  dataChunks = await fetchLastWeek();
  draw();
}

function updateState() {
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('filter', filterInput.value);

  facetsElement.querySelectorAll('input').forEach((e) => {
    if (e.checked) {
      url.searchParams.append(e.id.split('-')[0], e.value);
    }
  });
  window.history.replaceState({}, '', url);
}

loadData();
filterInput.value = new URL(window.location).searchParams.get('filter');

filterInput.addEventListener('input', () => {
  updateState();
  draw();
});
