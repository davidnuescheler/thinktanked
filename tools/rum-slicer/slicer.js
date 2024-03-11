// eslint-disable-next-line no-unused-vars, import/no-unresolved
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@3.4.4/+esm';
// eslint-disable-next-line import/no-unresolved
import 'https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon/+esm';

let SAMPLE_BUNDLE;
let DOMAIN_KEY = '1234';
let DOMAIN = 'www.thinktanked.org';

const viewSelect = document.getElementById('view');
const filterInput = document.getElementById('filter');
const facetsElement = document.getElementById('facets');
const canvas = document.getElementById('time-series');
let dataChunks = [];

function toISOStringWithTimezone(date) {
  // Pad a number to 2 digits
  const pad = (n) => `${Math.floor(Math.abs(n))}`.padStart(2, '0');

  // Get timezone offset in ISO format (+hh:mm or -hh:mm)
  const getTimezoneOffset = () => {
    const tzOffset = -date.getTimezoneOffset();
    const diff = tzOffset >= 0 ? '+' : '-';
    return `${diff}${pad(tzOffset / 60)}:${pad(tzOffset % 60)}`;
  };

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${getTimezoneOffset()}`;
}

// eslint-disable-next-line no-undef, no-new
const chart = new Chart(canvas, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'No CVW',
      backgroundColor: '#888',
      data: [],
    },
    {
      label: 'Good',
      backgroundColor: '#0cce6a',
      data: [],
    },
    {
      label: 'Needs Improvement',
      backgroundColor: '#ffa400',
      data: [],
    },
    {
      label: 'Poor',
      backgroundColor: '#ff4e43',
      data: [],
    }],
  },
  options: {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const { datasets } = context.chart.data;
            const value = context.parsed.y;
            const i = context.dataIndex;
            const total = datasets.reduce((pv, cv) => pv + cv.data[i], 0);

            return (`${context.dataset.label}: ${Math.round((value / total) * 1000) / 10}%`);
          },
        },
      },
    },
    interaction: {
      mode: 'x',
    },
    animation: {
      duration: 300,
    },
    datasets: {
      bar: {
        barPercentage: 1,
        categoryPercentage: 0.9,
        borderSkipped: false,
        borderRadius: {
          topLeft: 3,
          topRight: 3,
          bottomLeft: 3,
          bottomRight: 3,
        },
      },
    },
    responsive: true,
    scales: {
      x: {
        type: 'time',
        display: true,
        offset: true,
        time: {
          unit: 'day',
        },
        stacked: true,
        ticks: {
          minRotation: 90,
          maxRotation: 90,
          autoSkip: false,
        },
      },
      y: {
        stacked: true,
      },
    },
  },
});

function toHumanReadble(num) {
  const dp = 3;
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

  const precision = (dp - 1) - Math.floor(Math.log10(number));
  return `${number.toFixed(precision)}${units[u]}`;
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

  // deal with inp
  if (Math.random() < 0.5) bundle.events.splice(10, 1);
  else bundle.events[10].target = Math.floor(Math.random() * 600);

  // deal with cls
  if (Math.random() < 0.5) bundle.events.splice(9, 1);
  else bundle.events[9].target = Math.random() * 0.3;

  // deal with lcp
  if (Math.random() < 0.5) bundle.events.splice(8, 1);
  else bundle.events[8].target = Math.floor(Math.random() * 5000);

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
    const bundle = await createRandomBundle(date, (`${hour}`).padStart(2, '0'));
    bundles.push(bundle);
  }
  return (bundles);
}

function addCalculatedProps(bundle) {
  bundle.events.forEach((e) => {
    if (e.checkpoint === 'cwv-inp') {
      bundle.cwvINP = e.target;
    }
    if (e.checkpoint === 'cwv-lcp') {
      bundle.cwvLCP = e.target;
    }
    if (e.checkpoint === 'cwv-cls') {
      bundle.cwvCLS = e.target;
    }
  });
}

async function fetchUTCDay(utcISOString) {
  const [date] = utcISOString.split('T');
  const datePath = date.split('-').join('/');
  const apiRequestURL = `https://thinktanked.org/rum-bundles/${DOMAIN}/${datePath}?domainKey=${DOMAIN_KEY}`;
  console.log(apiRequestURL);
  const resp = await fetch(apiRequestURL);
  const json = await resp.json();
  const { rumBundles } = json;
  /*
  const rumBundles = [];
  for (let hour = 0; hour < 24; hour += 1) {
    // eslint-disable-next-line no-await-in-loop
    const hourBundles = await generateRandomRUMBundles(Math.random() * 100, date, hour);
    hourBundles.forEach((bundle) => addCalculatedProps(bundle));
    rumBundles.push(...hourBundles);
  }
  */
  rumBundles.forEach((bundle) => addCalculatedProps(bundle));
  return { date, rumBundles };
}

async function fetchUTCHour(utcISOString) {
  const [date, time] = utcISOString.split('T');
  const datePath = date.split('-').join('/');
  const hour = time.split(':')[0];
  const apiRequestURL = `https://thinktanked.org/rum-bundles/${DOMAIN}/${datePath}/${hour}?domainKey=${DOMAIN_KEY}`;
  console.log(apiRequestURL);
  const resp = await fetch(apiRequestURL);
  const json = await resp.json();
  const { rumBundles } = json;
  /*
  const rumBundles = await generateRandomRUMBundles(Math.random() * 100, date, hour);
  */
  rumBundles.forEach((bundle) => addCalculatedProps(bundle));
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
    date.setTime(date.getTime() - (3600 * 1000));
  }
  return chunks;
}

export async function fetchLast31Days() {
  const chunks = [];
  const date = new Date();
  const days = 31;
  for (let i = 0; i < days; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    chunks.unshift(await fetchUTCDay(date.toISOString()));
    date.setDate(date.getDate() - 1);
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
      if (filter.checkpoint.every((cp) => checkpoints.includes(cp))) {
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

  /* filter userAgent */
  if (matchedAll) {
    if (filter.userAgent.length) {
      if (filter.userAgent.includes(bundle.userAgent)) {
        filterMatches.userAgent = true;
      } else {
        matchedAll = false;
        filterMatches.userAgent = false;
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
  if (matchedAll) {
    checkpoints.forEach((val) => {
      if (facets.checkpoint[val]) facets.checkpoint[val] += bundle.weight;
      else facets.checkpoint[val] = bundle.weight;
    });
  }

  if (matchedEverythingElse('url')) {
    if (facets.url[bundle.url]) facets.url[bundle.url] += bundle.weight;
    else facets.url[bundle.url] = bundle.weight;
  }

  if (matchedEverythingElse('userAgent')) {
    if (facets.userAgent[bundle.userAgent]) facets.userAgent[bundle.userAgent] += bundle.weight;
    else facets.userAgent[bundle.userAgent] = bundle.weight;
  }

  return (matchedAll);
}

function createChartData(bundles, config) {
  const labels = [];
  const datasets = [];

  const stats = {};
  const cwvStructure = () => ({
    good: { weight: 0, average: 0 },
    ni: { weight: 0, average: 0 },
    poor: { weight: 0, average: 0 },
  });

  const scoreValue = (value, ni, poor) => {
    if (value >= poor) return 'poor';
    if (value >= ni) return 'ni';
    return 'good';
  };

  bundles.forEach((bundle) => {
    const slotTime = new Date(bundle.timeSlot);
    if (config.unit === 'day') slotTime.setHours(0);

    const localTimeSlot = toISOStringWithTimezone(slotTime);
    if (!stats[localTimeSlot]) {
      const s = {
        total: 0,
        lcp: cwvStructure(),
        inp: cwvStructure(),
        cls: cwvStructure(),
      };

      stats[localTimeSlot] = s;
    }
    const stat = stats[localTimeSlot];
    stat.total += bundle.weight;
    if (bundle.cwvLCP) {
      const score = scoreValue(bundle.cwvLCP, 2500, 4000);
      const bucket = stat.lcp[score];
      const newWeight = bundle.weight + bucket.weight;
      bucket.average = (
        (bucket.average * bucket.weight)
        + (bundle.cwvLCP * bundle.weight)
      ) / newWeight;
      bucket.weight = newWeight;
    }
  });

  const dataTotal = [];
  const dataGood = [];
  const dataNI = [];
  const dataPoor = [];

  const date = new Date();
  date.setMinutes(0);
  date.setSeconds(0);
  if (config.unit === 'day') date.setHours(0);

  for (let i = 0; i < config.units; i += 1) {
    const localTimeSlot = toISOStringWithTimezone(date);
    const stat = stats[localTimeSlot];
    // eslint-disable-next-line no-undef
    labels.unshift(localTimeSlot);
    const sumBucket = (bucket) => {
      bucket.weight = bucket.good.weight + bucket.ni.weight + bucket.poor.weight;
      if (bucket.weight) {
        bucket.average = ((bucket.good.weight * bucket.good.average)
      + (bucket.ni.weight * bucket.ni.average)
      + (bucket.poor.weight * bucket.poor.average)) / bucket.weight;
      } else {
        bucket.average = 0;
      }
    };

    if (stat) {
      sumBucket(stat.lcp);
      sumBucket(stat.cls);
      sumBucket(stat.inp);
      const cwvTotal = stat.lcp.weight + stat.cls.weight + stat.inp.weight;
      const cwvFactor = stat.total / cwvTotal;

      const cwvGood = stat.lcp.good.weight + stat.cls.good.weight + stat.inp.good.weight;
      const cwvNI = stat.lcp.ni.weight + stat.cls.ni.weight + stat.inp.ni.weight;
      const cwvPoor = stat.lcp.poor.weight + stat.cls.poor.weight + stat.inp.poor.weight;

      dataTotal.unshift(cwvTotal ? 0 : stat.total);
      dataGood.unshift(Math.round(cwvGood * cwvFactor));
      dataNI.unshift(Math.round(cwvNI * cwvFactor));
      dataPoor.unshift(Math.round(cwvPoor * cwvFactor));
    } else {
      dataTotal.unshift(0);
      dataGood.unshift(0);
      dataNI.unshift(0);
      dataPoor.unshift(0);
    }

    if (config.unit === 'hour') date.setTime(date.getTime() - (3600 * 1000));
    if (config.unit === 'day') date.setDate(date.getDate() - 1);
  }

  datasets.push({ data: dataTotal });
  datasets.push({ data: dataGood });
  datasets.push({ data: dataNI });
  datasets.push({ data: dataPoor });

  return { labels, datasets };
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
  const userAgent = params.getAll('userAgent');
  const view = params.get('view') || 'week';

  const filterText = params.get('filter') || '';
  const filtered = [];
  const filter = {
    text: filterText,
    checkpoint,
    target,
    url,
    userAgent,
  };

  const facets = {
    checkpoint: {},
    url: {},
    userAgent: {},
  };

  dataChunks.forEach((chunk) => {
    filtered.push(...chunk.rumBundles.filter((bundle) => filterBundle(bundle, filter, facets)));
  });
  const config = view === 'month' ? {
    view,
    unit: 'day',
    units: 30,
  } : {
    view,
    unit: 'hour',
    units: 24 * 7,
  };
  const { labels, datasets } = createChartData(filtered, config);
  datasets.forEach((ds, i) => {
    chart.data.datasets[i].data = ds.data;
  });
  chart.data.labels = labels;
  chart.options.scales.x.time.unit = config.unit;
  chart.update();
  updateFacets(facets);
}

async function loadData(scope) {
  if (scope === 'week') {
    dataChunks = await fetchLastWeek();
  }
  if (scope === 'month') {
    dataChunks = await fetchLast31Days();
  }

  draw();
}

function updateState() {
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('filter', filterInput.value);
  url.searchParams.set('view', viewSelect.value);

  facetsElement.querySelectorAll('input').forEach((e) => {
    if (e.checked) {
      url.searchParams.append(e.id.split('-')[0], e.value);
    }
  });
  window.history.replaceState({}, '', url);
}
const params = new URL(window.location).searchParams;
filterInput.value = params.get('filter');
const view = params.get('view') || 'week';
viewSelect.value = view;

loadData(view);

filterInput.addEventListener('input', () => {
  updateState();
  draw();
});

viewSelect.addEventListener('input', () => {
  updateState();
  window.location.reload();
});
