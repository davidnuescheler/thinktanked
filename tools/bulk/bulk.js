const log = document.getElementById('logger');
const append = (string, status="unknown") => {
    const p = document.createElement('p');
    p.textContent = string;
    p.classList.add("s-"+status);
    log.append(p);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

document.getElementById('start').addEventListener('click', () => {
    let counter = 0;
    const slow = document.getElementById('slow').checked;

    const executeOperation = async (url) => {
        const { hostname, pathname } = new URL(url);
        const [branch, repo, owner] = hostname.split('.')[0].split('--');
        const adminURL = `https://admin.hlx.page/${operation}/${owner}/${repo}/${branch}${pathname}`;
        const resp = await fetch(adminURL, {
            method: 'POST',
        });
        const text = await resp.text();
        console.log(text);
        counter += 1;
        append(`${counter}/${total}: ${adminURL}`, resp.status);
        document.getElementById('total').textContent = `${counter}/${total}`;
    }

    const dequeue = async () => {
        while (urls.length) {
            const url = urls.shift();
            await executeOperation(url);
            if(slow) await sleep(1500);
        }
    };

    const operation = document.getElementById('select').value;
    let concurrency = operation === 'live' ? 40 : 3;
    if(slow) {
        concurrency = 1;
    }
    const urls = document.getElementById('textarea').value
        .split('\n')
        .map(e => e.trim())
        .filter(e => e.length > 0);
    const total = urls.length;
    append(`URLs: ${urls.length}`);
    for (let i = 0; i < concurrency; i += 1) {
        dequeue();
    }
});
