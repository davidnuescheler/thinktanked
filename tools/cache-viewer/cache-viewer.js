const start = document.getElementById('start');
const logger = document.getElementById('logger');
async function checkURL(url) {
  const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?url=${url}&cache=off`, {
    headers: {
      'fastly-debug': 'true',
    },
    cache: 'no-cache',
  });
  await resp.text();
  const ttl = resp.headers.get('fastly-debug-ttl');
  const div = document.createElement('div');
  const hops = ttl.matchAll(/\(([M|H] [A-Za-z0-9-]* [0-9.-]* [0-9.-]* [0-9.-]*)\)/g);
  const cacheInfo = [];
  hops.forEach((hop) => {
    const [cacheStatus, serverIdentity, remainingTTL, staleIfErrorTTL, age] = hop[1].split(' ');
    /* eslint-disable-next-line no-console */
    console.log(cacheStatus, serverIdentity, remainingTTL, staleIfErrorTTL, age);
    cacheInfo.push(`${cacheStatus} ${serverIdentity.split('-').pop()} ${age.padStart(8, ' ')}`);
  });
  div.innerText = `${resp.status} ${url.padEnd(100, ' ')} ${cacheInfo.join(' => ')}`;
  logger.append(div);
}

async function checkURLs(urls) {
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    // eslint-disable-next-line no-await-in-loop
    await checkURL(url);
  }
}

start.addEventListener('click', () => {
  const urls = document.getElementById('urls').value.split('\n').map((e) => e.trim());
  checkURLs(urls);
});
