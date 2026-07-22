const TRAILING_SLASH_MAJORITY = 0.8;
const DEFAULT_LOCALE_DEPTH = 1;
const DEFAULT_LOCALE_KEY = '';
const DEFAULT_LOCALE_LABEL = 'default';
const FCORS_BASE = 'https://www.fcors.org/';
const FCORS_API_KEY = 'XiKldIyVZFnouIUO';
const DA_ORIGIN = 'https://admin.da.live';
const DA_SDK_URL = 'https://da.live/nx/utils/sdk.js';
const DA_SDK_TIMEOUT_MS = 2000;
const DA_LIST_CONCURRENCY = 10;
const AEM_HOST_PATTERN = /^(.+)--(.+)--([^.]+)\.aem\.(live|page)$/i;

const siteData = {
    lines: [],
    index: null,
    loading: false,
    stripTrailingSlashes: false,
    localeDepth: DEFAULT_LOCALE_DEPTH,
    locales: [],
    localeTotals: new Map(),
    pageRegistry: new Map(),
    sourceUrl: '',
    daTarget: null,
    daConnected: false,
    presenceStats: null,
    diffOnly: false,
    openFolder: [],
};

let daSdkPromise = null;
const selectedFolders = new Set();
const selectedPages = new Set();

function pathKey(pathSegments) {
    return JSON.stringify(pathSegments);
}

function parsePathKey(key) {
    return JSON.parse(key);
}

function getPreviewLinkForPageLocale(pageKey, locale) {
    const entry = siteData.pageRegistry.get(pageKey);
    if (!entry || getLocalePresence(pageKey, locale) === 'none') return null;
    if (entry.sitemapUrls.has(locale)) return entry.sitemapUrls.get(locale);
    const origin = getSitemapLoadOrigin();
    if (!origin) return null;
    let path = '';
    if (siteData.localeDepth > 0) path += `/${locale}`;
    if (pageKey) {
        const pagePath = pageKey.endsWith('/') ? pageKey.slice(0, -1) : pageKey;
        path += `/${pagePath}`;
    } else if (!path) {
        path = '/';
    }
    return new URL(path, origin).href;
}

function getCopyableUrlsForPage(pageKey) {
    const locales = siteData.localeDepth === 0 ? [DEFAULT_LOCALE_KEY] : siteData.locales;
    const urls = [];
    locales.forEach((locale) => {
        const url = getPreviewLinkForPageLocale(pageKey, locale);
        if (url) urls.push(url);
    });
    return urls;
}

function getCopyableUrlsUnderPath(pathSegments) {
    const urls = new Set();
    getDistinctPathsUnderPath(pathSegments, false).forEach((pageKey) => {
        getCopyableUrlsForPage(pageKey).forEach((url) => urls.add(url));
    });
    return [...urls];
}

function getUrlsForSelection() {
    const urls = new Set();
    selectedFolders.forEach((key) => {
        getCopyableUrlsUnderPath(parsePathKey(key)).forEach((url) => urls.add(url));
    });
    selectedPages.forEach((pageKey) => {
        getCopyableUrlsForPage(pageKey).forEach((url) => urls.add(url));
    });
    return [...urls].sort((a, b) => a.localeCompare(b));
}

function updateSelectionUI() {
    const folderCount = selectedFolders.size;
    const pageCount = selectedPages.size;
    const itemCount = folderCount + pageCount;
    const urlCount = itemCount ? getUrlsForSelection().length : 0;
    const copyBtn = document.getElementById('copy-selected-btn');
    const countEl = document.getElementById('selection-count');
    copyBtn.disabled = itemCount === 0 || siteData.loading;
    if (!itemCount) {
        countEl.textContent = '';
        return;
    }
    const parts = [];
    if (folderCount) {
        parts.push(`${folderCount.toLocaleString()} folder${folderCount === 1 ? '' : 's'}`);
    }
    if (pageCount) {
        parts.push(`${pageCount.toLocaleString()} page${pageCount === 1 ? '' : 's'}`);
    }
    countEl.textContent = `${parts.join(', ')}, ${urlCount.toLocaleString()} URL${urlCount === 1 ? '' : 's'}`;
}

function clearSelection() {
    selectedFolders.clear();
    selectedPages.clear();
    document.querySelectorAll('.tree-row.folder.selected, .tree-row.page.selected').forEach((row) => {
        row.classList.remove('selected');
        const cb = row.querySelector('.tree-select');
        if (cb) cb.checked = false;
    });
    updateSelectionUI();
}

function createTreeCheckbox(key, row, kind) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'tree-select';
    const selected = kind === 'folder' ? selectedFolders : selectedPages;
    cb.checked = selected.has(key);
    if (cb.checked) row.classList.add('selected');
    if (kind === 'folder') {
        const pathSegments = parsePathKey(key);
        const pathLabel = pathSegments.length ? `/${pathSegments.join('/')}` : '/';
        cb.setAttribute('aria-label', `Select folder ${pathLabel}`);
    } else {
        cb.setAttribute('aria-label', `Select page ${key || '(locale root)'}`);
    }
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', () => {
        if (cb.checked) {
            selected.add(key);
            row.classList.add('selected');
        } else {
            selected.delete(key);
            row.classList.remove('selected');
        }
        updateSelectionUI();
    });
    return cb;
}

async function copySelectedUrls() {
    const urls = getUrlsForSelection();
    if (!urls.length) return;
    const text = urls.join('\n');
    const copyBtn = document.getElementById('copy-selected-btn');
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = original;
    }, 1500);
}

function logDa(phase, details = {}) {
    console.log('[MSM DA]', phase, details);
}

function logDaSdkState(sdk, label = 'sdk') {
    if (!sdk) {
        logDa(`${label}: missing`);
        return;
    }
    logDa(`${label}: state`, {
        hasToken: Boolean(sdk.token),
        hasActions: Boolean(sdk.actions),
        hasDaFetch: Boolean(sdk.actions?.daFetch),
        context: sdk.context ? {
            org: sdk.context.org,
            repo: sdk.context.repo,
            branch: sdk.context.branch,
        } : null,
    });
}

function formatLocaleLabel(locale) {
    return locale || DEFAULT_LOCALE_LABEL;
}

function isLocalhostHostname(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

function normalizeSitemapUrl(urlString, baseUrl) {
    try {
        const url = new URL(urlString.trim(), baseUrl);
        if (!isLocalhostHostname(url.hostname) && url.protocol === 'http:') {
            url.protocol = 'https:';
        }
        return url.href;
    } catch {
        return urlString;
    }
}

function getSitemapLoadOrigin() {
    if (!siteData.sourceUrl) return null;
    try {
        return new URL(siteData.sourceUrl).origin;
    } catch {
        return null;
    }
}

function resolvePreviewUrl(sitemapLoc) {
    try {
        const locUrl = new URL(sitemapLoc);
        const origin = getSitemapLoadOrigin();
        if (!origin) return locUrl.href;
        return new URL(`${locUrl.pathname}${locUrl.search}${locUrl.hash}`, origin).href;
    } catch {
        return sitemapLoc;
    }
}

function readLocaleDepthFromUrl(search = window.location.search) {
    const value = new URLSearchParams(search).get('prefix');
    if (value === null) return DEFAULT_LOCALE_DEPTH;
    const depth = Number(value);
    if (Number.isInteger(depth) && depth >= 0 && depth <= 3) return depth;
    return DEFAULT_LOCALE_DEPTH;
}

function readLocaleDepthFromControl() {
    return Number(document.getElementById('locale-prefix').value);
}

function readDiffOnlyFromUrl(search = window.location.search) {
    const value = new URLSearchParams(search).get('diff');
    return value === '1' || value === 'true';
}

function folderPathToParam(pathSegments) {
    return pathSegments.map((seg) => encodeURIComponent(seg)).join('/');
}

function readFolderFromUrl(search = window.location.search) {
    const value = new URLSearchParams(search).get('folder');
    if (!value) return [];
    return value.split('/').map((seg) => decodeURIComponent(seg)).filter(Boolean);
}

function isFolderPathPrefix(prefix, path) {
    return prefix.length <= path.length && prefix.every((seg, i) => path[i] === seg);
}

function setOpenFolder(pathSegments) {
    siteData.openFolder = pathSegments;
    updateMsmUrl({ folder: pathSegments });
}

function updateMsmUrl({ url, diffOnly, folder, localePrefix } = {}) {
    const params = new URLSearchParams();
    const sitemapUrl = url ?? siteData.sourceUrl ?? document.getElementById('url').value;
    if (sitemapUrl) params.set('url', sitemapUrl);
    const diff = diffOnly ?? siteData.diffOnly;
    if (diff) params.set('diff', '1');
    const folderPath = folder ?? siteData.openFolder;
    if (folderPath?.length) params.set('folder', folderPathToParam(folderPath));
    const prefix = localePrefix !== undefined ? localePrefix : siteData.localeDepth;
    params.set('prefix', String(prefix));
    const query = params.toString();
    const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    history.pushState({}, '', next);
}

function parseAemDaTarget(urlString) {
    if (!urlString) return null;
    try {
        const { hostname } = new URL(urlString);
        const match = hostname.match(AEM_HOST_PATTERN);
        if (!match) return null;
        const [, branch, site, org] = match;
        return { branch, org, repo: site };
    } catch {
        return null;
    }
}

function resolveDaTarget(sdk) {
    const fromUrl = parseAemDaTarget(siteData.sourceUrl);
    const fromSdk = sdk?.context ? { org: sdk.context.org, repo: sdk.context.repo, branch: sdk.context.branch ?? null } : null;
    logDa('resolve target', {
        sourceUrl: siteData.sourceUrl,
        fromUrl,
        fromSdk,
    });
    if (fromUrl) return fromUrl;
    if (fromSdk?.org && fromSdk?.repo) return { org: fromSdk.org, repo: fromSdk.repo, branch: fromSdk.branch };
    return null;
}

function fcorsUrl(targetUrl) {
    const params = new URLSearchParams({
        url: targetUrl,
        key: FCORS_API_KEY,
    });
    return `${FCORS_BASE}?${params.toString()}`;
}

function isStandaloneDevHost() {
    const { hostname } = window.location;
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

async function loadDaSdk() {
    if (!daSdkPromise) {
        daSdkPromise = import(DA_SDK_URL).then((mod) => mod.default);
    }
    return daSdkPromise;
}

async function loadDaSdkOptional(timeoutMs = DA_SDK_TIMEOUT_MS) {
    if (isStandaloneDevHost()) {
        logDa('sdk load skipped', { reason: 'standalone dev host', hostname: window.location.hostname });
        return null;
    }
    logDa('sdk load start', { url: DA_SDK_URL, timeoutMs });
    try {
        const sdk = await Promise.race([
            loadDaSdk(),
            new Promise((resolve) => {
                setTimeout(() => resolve(null), timeoutMs);
            }),
        ]);
        if (!sdk) {
            logDa('sdk load failed', { reason: 'timeout or empty response', timeoutMs });
            return null;
        }
        logDaSdkState(sdk, 'sdk loaded');
        return sdk;
    } catch (error) {
        logDa('sdk load failed', { reason: 'import error', message: error?.message || String(error) });
        return null;
    }
}

function daHtmlToPageKey(relativePath) {
    if (!relativePath || relativePath === 'index') return '';
    return relativePath;
}

function daItemToPageKey(itemPath, org, repo, locale) {
    const prefix = `/${org}/${repo}/${locale}/`;
    if (!itemPath.startsWith(prefix)) return null;
    let relative = itemPath.slice(prefix.length);
    if (relative.endsWith('.html')) relative = relative.slice(0, -5);
    return daHtmlToPageKey(relative);
}

function daEditUrl(itemPath) {
    return `https://da.live/edit#${itemPath.replace(/\.html$/, '')}`;
}

function ensurePageEntry(pageKey) {
    if (!siteData.pageRegistry.has(pageKey)) {
        siteData.pageRegistry.set(pageKey, {
            sitemapUrls: new Map(),
            daPaths: new Map(),
        });
    }
    return siteData.pageRegistry.get(pageKey);
}

function getLocalePresence(pageKey, locale) {
    const entry = siteData.pageRegistry.get(pageKey);
    if (!entry) return 'none';
    const inSitemap = entry.sitemapUrls.has(locale);
    const inDa = entry.daPaths.has(locale);
    if (inSitemap && inDa) return 'both';
    if (inSitemap) return 'sitemap';
    if (inDa) return 'da';
    return 'none';
}

function pageHasLocaleDiff(pageKey) {
    if (siteData.locales.length < 2) return false;
    let baseline = null;
    for (let i = 0; i < siteData.locales.length; i += 1) {
        const presence = getLocalePresence(pageKey, siteData.locales[i]);
        if (baseline === null) baseline = presence;
        else if (presence !== baseline) return true;
    }
    return false;
}

function folderHasLocaleDiff(pathSegments) {
    let found = false;
    siteData.pageRegistry.forEach((entry, pageKey) => {
        if (found) return;
        if (!pageKeyUnderFolderPath(pageKey, pathSegments)) return;
        if (pageHasLocaleDiff(pageKey)) found = true;
    });
    return found;
}

function countDiffPages() {
    let count = 0;
    siteData.pageRegistry.forEach((entry, pageKey) => {
        if (pageHasLocaleDiff(pageKey)) count += 1;
    });
    return count;
}

async function listDaPath(daFetch, listPath) {
    const url = `${DA_ORIGIN}/list${listPath}`;
    const resp = await daFetch(url);
    if (!resp.ok) {
        logDa('list failed', { listPath, status: resp.status, statusText: resp.statusText });
        return { files: [], folders: [] };
    }
    const json = await resp.json();
    const files = [];
    const folders = [];
    (Array.isArray(json) ? json : []).forEach((child) => {
        if (!child.name) return;
        if (child.ext) files.push(child);
        else folders.push(child.path);
    });
    logDa('list ok', { listPath, files: files.length, folders: folders.length });
    return { files, folders };
}

async function crawlDaRepo(daFetch, org, repo, locales, onProgress) {
    const htmlByLocale = new Map(locales.map((locale) => [locale, []]));
    const queues = locales.map((locale) => {
        const root = `/${org}/${repo}/${locale}`;
        return {
            locale,
            pending: [root],
            seen: new Set([root]),
            cursor: 0,
        };
    });

    let inFlight = 0;

    const pickQueue = () => {
        for (let i = 0; i < queues.length; i += 1) {
            const queue = queues[i];
            if (queue.cursor < queue.pending.length) return queue;
        }
        return null;
    };

    const isFinished = () => inFlight === 0 && !pickQueue();

    return new Promise((resolve) => {
        const pump = () => {
            while (inFlight < DA_LIST_CONCURRENCY) {
                const queue = pickQueue();
                if (!queue) {
                    if (isFinished()) resolve(htmlByLocale);
                    return;
                }

                const listPath = queue.pending[queue.cursor];
                queue.cursor += 1;
                inFlight += 1;
                onProgress?.(listPath, queue.locale);

                listDaPath(daFetch, listPath)
                    .then(({ files, folders }) => {
                        const htmlFiles = htmlByLocale.get(queue.locale);
                        files.forEach((file) => {
                            if (file.ext === 'html') htmlFiles.push(file);
                        });
                        folders.forEach((folder) => {
                            if (!queue.seen.has(folder)) {
                                queue.seen.add(folder);
                                queue.pending.push(folder);
                            }
                        });
                    })
                    .finally(() => {
                        inFlight -= 1;
                        if (isFinished()) {
                            resolve(htmlByLocale);
                        } else {
                            pump();
                        }
                    });
            }
        };
        pump();
    });
}

function rebuildIndexFromPageRegistry() {
    siteData.index = createIndexNode();
    siteData.pageRegistry.forEach((entry, pageKey) => {
        const { segments, isDirectory } = pageKeySegments(pageKey);
        addPageToIndex(siteData.index, segments, isDirectory);
    });
}

function computePresenceStats() {
    const stats = {
        paths: siteData.pageRegistry.size,
        both: 0,
        sitemapOnly: 0,
        daOnly: 0,
    };
    siteData.pageRegistry.forEach((entry, pageKey) => {
        siteData.locales.forEach((locale) => {
            const presence = getLocalePresence(pageKey, locale);
            if (presence === 'both') stats.both += 1;
            else if (presence === 'sitemap') stats.sitemapOnly += 1;
            else if (presence === 'da') stats.daOnly += 1;
        });
    });
    siteData.presenceStats = stats;
    return stats;
}

async function augmentFromDa(sdk) {
    logDa('augment start', {
        localeDepth: siteData.localeDepth,
        locales: siteData.locales,
        localeCount: siteData.locales.length,
    });
    logDaSdkState(sdk, 'augment sdk');

    const { daFetch } = sdk.actions || {};
    if (!sdk.token) {
        logDa('augment skipped', { reason: 'missing token' });
        return false;
    }
    if (!daFetch) {
        logDa('augment skipped', { reason: 'missing daFetch action' });
        return false;
    }
    if (siteData.localeDepth === 0) {
        logDa('augment skipped', { reason: 'localeDepth is 0 (no locale prefix detected)' });
        return false;
    }
    if (!siteData.locales.length) {
        logDa('augment skipped', { reason: 'no locales from sitemap' });
        return false;
    }

    const target = resolveDaTarget(sdk);
    if (!target?.org || !target?.repo) {
        logDa('augment skipped', {
            reason: 'could not resolve org/repo',
            target,
            sourceUrl: siteData.sourceUrl,
        });
        return false;
    }
    siteData.daTarget = target;
    const { org, repo } = target;
    logDa('augment crawl start', { org, repo, locales: siteData.locales, concurrency: DA_LIST_CONCURRENCY });

    let totalHtmlFiles = 0;
    let totalMappedPages = 0;
    const htmlByLocale = await crawlDaRepo(daFetch, org, repo, siteData.locales, (path, locale) => {
        updateLoadStatus(`DA: ${formatLocaleLabel(locale)} ${path.split('/').slice(-3).join('/')}`);
    });

    htmlByLocale.forEach((files, locale) => {
        totalHtmlFiles += files.length;
        let mappedForLocale = 0;
        files.forEach((file) => {
            const pageKey = daItemToPageKey(file.path, org, repo, locale);
            if (pageKey === null) return;
            mappedForLocale += 1;
            ensurePageEntry(pageKey).daPaths.set(locale, file.path);
        });
        totalMappedPages += mappedForLocale;
        logDa('locale crawl done', {
            locale,
            htmlFiles: files.length,
            mappedPages: mappedForLocale,
            root: `/${org}/${repo}/${locale}`,
        });
    });

    rebuildIndexFromPageRegistry();
    siteData.locales = sortLocalesByPageCount(new Set(siteData.locales));
    siteData.daConnected = true;
    computePresenceStats();
    logDa('augment complete', {
        connected: true,
        target: siteData.daTarget,
        totalHtmlFiles,
        totalMappedPages,
        presenceStats: siteData.presenceStats,
    });
    return true;
}

function setLoading(loading) {
    siteData.loading = loading;
    document.getElementById('load-status').hidden = !loading;
    document.querySelector('#input-form button').disabled = loading;
    document.getElementById('url').disabled = loading;
    updateSelectionUI();
    updateLocalePrefixControl();
}

function updateLoadStatus(file) {
    document.getElementById('load-status-file').textContent = file;
    document.getElementById('load-status-count').textContent = siteData.lines.length.toLocaleString();
}

function createIndexNode() {
    return { leafCount: 0, urlCount: 0, folders: new Map() };
}

function parsePathname(loc, stripTrailingSlashes) {
    let pathname = new URL(loc).pathname;
    if (stripTrailingSlashes && pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }
    const isDirectory = pathname.length > 1 && pathname.endsWith('/');
    const segments = pathname.split('/').filter(Boolean);
    return { segments, isDirectory };
}

function pageKeyFromSegments(segments, isDirectory) {
    if (!segments.length) return '';
    const tail = segments[segments.length - 1];
    const path = segments.join('/');
    return isDirectory ? `${path}/` : path;
}

function pageKeySegments(pageKey) {
    if (!pageKey) return { segments: [], isDirectory: false };
    const isDirectory = pageKey.endsWith('/');
    const segments = (isDirectory ? pageKey.slice(0, -1) : pageKey).split('/').filter(Boolean);
    return { segments, isDirectory };
}

function pageKeyUnderFolderPath(pageKey, pathSegments) {
    const { segments } = pageKeySegments(pageKey);
    if (segments.length < pathSegments.length) return false;
    return pathSegments.every((seg, i) => segments[i] === seg);
}

function isLeafInPagesBucket(pageKey, pathSegments) {
    const { segments, isDirectory } = pageKeySegments(pageKey);
    if (isDirectory) return false;
    const parent = segments.length <= 1 ? [] : segments.slice(0, -1);
    if (parent.length !== pathSegments.length) return false;
    return pathSegments.every((seg, i) => parent[i] === seg);
}

function getDistinctPathsUnderPath(pathSegments, pagesOnly = false) {
    const keys = [];
    siteData.pageRegistry.forEach((entry, pageKey) => {
        if (siteData.diffOnly && !pageHasLocaleDiff(pageKey)) return;
        if (pagesOnly) {
            if (isLeafInPagesBucket(pageKey, pathSegments)) keys.push(pageKey);
        } else if (pageKeyUnderFolderPath(pageKey, pathSegments)) {
            keys.push(pageKey);
        }
    });
    return keys.sort((a, b) => a.localeCompare(b));
}

function countDistinctPaths(pathSegments, pagesOnly = false) {
    return getDistinctPathsUnderPath(pathSegments, pagesOnly).length;
}

function countPathsForLocale(pathSegments, locale, pagesOnly = false) {
    return getDistinctPathsUnderPath(pathSegments, pagesOnly)
        .filter((pageKey) => getLocalePresence(pageKey, locale) !== 'none').length;
}

function getPageLabelFromKey(pageKey) {
    const { segments, isDirectory } = pageKeySegments(pageKey);
    if (!segments.length) return '(locale root)';
    const name = segments[segments.length - 1];
    return isDirectory ? `${name}/` : name;
}

function sortLocalesByPageCount(localeSet) {
    const totals = new Map();
    localeSet.forEach((locale) => totals.set(locale, 0));
    siteData.pageRegistry.forEach((entry, pageKey) => {
        localeSet.forEach((locale) => {
            if (getLocalePresence(pageKey, locale) !== 'none') {
                totals.set(locale, (totals.get(locale) || 0) + 1);
            }
        });
    });
    siteData.localeTotals = totals;
    return [...localeSet].sort((a, b) => {
        const diff = (totals.get(b) || 0) - (totals.get(a) || 0);
        return diff !== 0 ? diff : a.localeCompare(b);
    });
}

function looksLikeFileSegment(segment) {
    return /\.[a-z0-9][\w.-]*$/i.test(segment);
}

function localePrefixUsesFolderSegments(segments, depth, isDirectory) {
    if (depth === 0) return true;
    const localeSegments = segments.slice(0, depth);
    if (localeSegments.some(looksLikeFileSegment)) return false;
    if (segments.length > depth) return true;
    return isDirectory && segments.length === depth;
}

function parsePageUrl(line) {
    const loc = line.split('\t')[0];
    if (!loc) return null;
    try {
        const { segments, isDirectory } = parsePathname(loc, siteData.stripTrailingSlashes);
        if (siteData.localeDepth === 0) {
            return {
                loc,
                locale: DEFAULT_LOCALE_KEY,
                pageSegments: segments,
                isDirectory,
                pageKey: pageKeyFromSegments(segments, isDirectory),
            };
        }
        if (segments.length < siteData.localeDepth) return null;
        if (!localePrefixUsesFolderSegments(segments, siteData.localeDepth, isDirectory)) return null;
        const locale = segments.slice(0, siteData.localeDepth).join('/');
        const pageSegments = segments.slice(siteData.localeDepth);
        return {
            loc,
            locale,
            pageSegments,
            isDirectory,
            pageKey: pageKeyFromSegments(pageSegments, isDirectory),
        };
    } catch {
        return null;
    }
}

function countTrailingSlashUrls(lines) {
    let slashCount = 0;
    lines.forEach((line) => {
        const loc = line.split('\t')[0];
        if (!loc) return;
        try {
            const { pathname } = new URL(loc);
            if (pathname.length > 1 && pathname.endsWith('/')) slashCount += 1;
        } catch {
            /* ignore */
        }
    });
    return slashCount;
}

function addPageToIndex(index, pageSegments, isDirectory) {
    if (pageSegments.length === 0) return;

    if (isDirectory) {
        let node = index;
        for (let i = 0; i < pageSegments.length; i += 1) {
            const folder = pageSegments[i];
            if (!node.folders.has(folder)) {
                node.folders.set(folder, createIndexNode());
            }
            const child = node.folders.get(folder);
            child.urlCount += 1;
            node = child;
        }
        node.leafCount += 1;
        return;
    }

    if (pageSegments.length === 1) {
        index.leafCount += 1;
        return;
    }

    let node = index;
    for (let i = 0; i < pageSegments.length - 1; i += 1) {
        const folder = pageSegments[i];
        if (!node.folders.has(folder)) {
            node.folders.set(folder, createIndexNode());
        }
        const child = node.folders.get(folder);
        child.urlCount += 1;
        node = child;
    }
    node.leafCount += 1;
}

function rebuildSiteModel() {
    siteData.pageRegistry = new Map();
    siteData.index = createIndexNode();

    const localeSet = new Set();
    siteData.lines.forEach((line) => {
        const parsed = parsePageUrl(line);
        if (!parsed) return;
        localeSet.add(parsed.locale);
        addPageToIndex(siteData.index, parsed.pageSegments, parsed.isDirectory);
        ensurePageEntry(parsed.pageKey).sitemapUrls.set(parsed.locale, resolvePreviewUrl(parsed.loc));
    });

    siteData.locales = sortLocalesByPageCount(localeSet)
        .filter((locale) => locale !== DEFAULT_LOCALE_KEY);
    computePresenceStats();
}

function applyTrailingSlashPolicy() {
    const { lines } = siteData;
    if (!lines.length) {
        siteData.stripTrailingSlashes = false;
        return;
    }
    const slashCount = countTrailingSlashUrls(lines);
    siteData.stripTrailingSlashes = slashCount / lines.length >= TRAILING_SLASH_MAJORITY;
    rebuildSiteModel();
}

function getIndexAtPath(pathSegments) {
    let node = siteData.index;
    for (let i = 0; i < pathSegments.length; i += 1) {
        if (!node?.folders.has(pathSegments[i])) return null;
        node = node.folders.get(pathSegments[i]);
    }
    return node;
}

function getFolderEntries(pathSegments) {
    const index = getIndexAtPath(pathSegments);
    if (!index) return [];
    const entries = [];
    index.folders.forEach((child, name) => {
        const childPath = [...pathSegments, name];
        if (siteData.diffOnly && !folderHasLocaleDiff(childPath)) return;
        entries.push([name, countDistinctPaths(childPath, false)]);
    });
    return entries.sort((a, b) => b[1] - a[1]);
}

function setTotalPaths(count) {
    document.getElementById('total-paths').textContent = count.toLocaleString();
}

function updateTotalPathsDisplay() {
    const count = siteData.diffOnly ? countDiffPages() : siteData.pageRegistry.size;
    setTotalPaths(count);
}

function updateDiffOnlyToggle() {
    const toggle = document.getElementById('diff-only');
    const enabled = siteData.locales.length >= 2 && siteData.lines.length > 0;
    toggle.disabled = !enabled;
    if (!enabled && siteData.diffOnly && !siteData.loading) {
        siteData.diffOnly = false;
        toggle.checked = false;
        updateMsmUrl({ diffOnly: false });
    }
}

function updateLocalePrefixControl() {
    const select = document.getElementById('locale-prefix');
    select.disabled = siteData.loading;
    select.value = String(siteData.localeDepth);
}

function setLoadUrlCount(count) {
    if (siteData.loading) {
        document.getElementById('load-status-count').textContent = count.toLocaleString();
    }
}

function updateLocaleMeta() {
    const meta = document.getElementById('locale-meta');
    if (!siteData.locales.length) {
        meta.textContent = siteData.lines.length
            ? `${siteData.lines.length.toLocaleString()} sitemap URLs`
            : '';
        return;
    }
    const prefixLabel = (() => {
        const depth = siteData.localeDepth;
        if (depth === 0) return 'no locale prefix';
        return `${depth}-segment prefix`;
    })();
    const parts = [
        `${siteData.locales.length} locale${siteData.locales.length === 1 ? '' : 's'}`,
        prefixLabel,
        `${siteData.lines.length.toLocaleString()} sitemap URLs`,
    ];
    if (siteData.daConnected && siteData.presenceStats) {
        const { both, sitemapOnly, daOnly } = siteData.presenceStats;
        parts.push(`✓ ${both.toLocaleString()} both`, `↑ ${sitemapOnly.toLocaleString()} sitemap only`, `↓ ${daOnly.toLocaleString()} DA only`);
        if (siteData.daTarget) {
            parts.push(`DA ${siteData.daTarget.org}/${siteData.daTarget.repo}`);
        }
    } else if (!isStandaloneDevHost()) {
        parts.push('DA not connected');
    }
    meta.textContent = parts.join(' · ');
}

function appendSitemapLines(lines) {
    if (!lines?.length) return;
    siteData.lines.push(...lines);
    setLoadUrlCount(siteData.lines.length);
}

async function loadSitemap(sitemapURL, callbacks) {
    try {
        const normalizedSitemapURL = normalizeSitemapUrl(sitemapURL);
        callbacks.onFileStart(normalizedSitemapURL);
        const resp = await fetch(fcorsUrl(normalizedSitemapURL), { cache: 'no-store' });
        const xml = await resp.text();
        const sitemap = new DOMParser().parseFromString(xml, 'text/xml');
        const subSitemaps = [...sitemap.querySelectorAll('sitemap loc')];
        for (let i = 0; i < subSitemaps.length; i += 1) {
            const loc = subSitemaps[i];
            const subSitemapURL = normalizeSitemapUrl(loc.textContent.trim(), normalizedSitemapURL);
            // eslint-disable-next-line no-await-in-loop
            await loadSitemap(subSitemapURL, callbacks);
        }
        const newLines = [];
        sitemap.querySelectorAll('url').forEach((url) => {
            const loc = url.querySelector('loc');
            const locURL = normalizeSitemapUrl(loc.textContent.trim(), normalizedSitemapURL);
            const lastMod = url.querySelector('lastmod');
            const lastModDate = lastMod ? lastMod.textContent.trim() : '';
            newLines.push(`${locURL}\t${lastModDate}`);
        });
        if (newLines.length) {
            callbacks.onUrlsFound(newLines);
        }
    } catch (e) {
        console.error(e);
    }
}

async function getRootSitemaps(url) {
    const resp = await fetch(fcorsUrl(`${url}robots.txt`), { cache: 'no-store' });
    const txt = await resp.text();
    const sitemapURLs = [];
    txt.split('\n').forEach((line) => {
        const [name, value] = line.split(/:(.*)/s);
        if (name.trim().toLowerCase() === 'sitemap') {
            sitemapURLs.push(normalizeSitemapUrl(value.trim(), url));
        }
    });
    return sitemapURLs;
}

document.getElementById('input-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = new URL(normalizeSitemapUrl(document.getElementById('url').value));
    siteData.sourceUrl = url.href;
    siteData.localeDepth = readLocaleDepthFromControl();
    updateMsmUrl({ url: url.href, diffOnly: siteData.diffOnly, localePrefix: siteData.localeDepth });
    siteData.lines = [];
    siteData.index = createIndexNode();
    siteData.pageRegistry = new Map();
    siteData.locales = [];
    siteData.localeTotals = new Map();
    siteData.stripTrailingSlashes = false;
    siteData.daConnected = false;
    siteData.daTarget = null;
    siteData.presenceStats = null;
    clearSelection();
    setTotalPaths(0);
    setLoadUrlCount(0);
    updateLocaleMeta();
    setLoading(true);
    renderTree();
    updateLoadStatus('Starting…');

    const callbacks = {
        onFileStart: (file) => updateLoadStatus(file),
        onUrlsFound: (lines) => appendSitemapLines(lines),
    };

    try {
        if (url.pathname === '/') {
            const sitemapURLs = await getRootSitemaps(url.href);
            for (let i = 0; i < sitemapURLs.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await loadSitemap(sitemapURLs[i], callbacks);
            }
        } else {
            await loadSitemap(url.href, callbacks);
        }
        applyTrailingSlashPolicy();
        updateTotalPathsDisplay();

        const sdk = await loadDaSdkOptional();
        if (sdk?.token && sdk.actions?.daFetch) {
            const connected = await augmentFromDa(sdk);
            if (!connected) {
                siteData.daConnected = false;
                computePresenceStats();
                logDa('not connected', {
                    reason: 'augmentFromDa returned false — see earlier [MSM DA] logs',
                    localeDepth: siteData.localeDepth,
                    locales: siteData.locales,
                    daTarget: siteData.daTarget,
                });
            }
        } else {
            siteData.daConnected = false;
            computePresenceStats();
            logDa('not connected', {
                reason: sdk ? 'sdk missing token or daFetch' : 'sdk unavailable',
                hostname: window.location.hostname,
                sourceUrl: siteData.sourceUrl,
            });
            if (sdk) logDaSdkState(sdk, 'sdk rejected');
        }
        updateTotalPathsDisplay();
        updateLocaleMeta();
    } finally {
        setLoading(false);
        renderTree();
    }
});

function createLocaleCells(pageKey) {
    const cells = document.createElement('div');
    cells.className = 'locale-cells';
    const entry = siteData.pageRegistry.get(pageKey);
    siteData.locales.forEach((locale, index) => {
        const cell = document.createElement('span');
        cell.className = 'locale-cell';
        cell.style.gridColumn = String(3 + index);
        const presence = getLocalePresence(pageKey, locale);
        if (presence === 'none') {
            cell.classList.add('missing');
            cell.textContent = '·';
            cell.title = `Missing in ${formatLocaleLabel(locale)}`;
            cells.appendChild(cell);
            return;
        }

        const link = document.createElement('a');
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '✓';

        if (!siteData.daConnected) {
            cell.classList.add('present-both');
            link.href = entry.sitemapUrls.get(locale);
            link.title = entry.sitemapUrls.get(locale);
        } else {
            cell.classList.add(`present-${presence}`);
            if (presence === 'both') {
                link.href = entry.sitemapUrls.get(locale);
                link.title = `Sitemap and DA\n${entry.sitemapUrls.get(locale)}`;
            } else if (presence === 'sitemap') {
                link.href = entry.sitemapUrls.get(locale);
                link.title = `Sitemap only\n${entry.sitemapUrls.get(locale)}`;
            } else {
                link.href = daEditUrl(entry.daPaths.get(locale));
                link.title = `DA only\n${entry.daPaths.get(locale)}`;
            }

            const daPath = entry.daPaths.get(locale);
            if (daPath && presence !== 'da') {
                link.addEventListener('click', (e) => {
                    if (!e.shiftKey) return;
                    e.preventDefault();
                    window.open(daEditUrl(daPath), '_blank', 'noopener');
                });
            }
        }

        cell.appendChild(link);
        cells.appendChild(cell);
    });
    return cells;
}

function createLocaleCountCells(pathSegments, pagesOnly = false) {
    const cells = document.createElement('div');
    cells.className = 'locale-cells';
    siteData.locales.forEach((locale, index) => {
        const cell = document.createElement('span');
        cell.className = 'locale-cell count';
        cell.style.gridColumn = String(3 + index);
        const count = countPathsForLocale(pathSegments, locale, pagesOnly);
        cell.textContent = count.toLocaleString();
        cell.title = `${count.toLocaleString()} path${count === 1 ? '' : 's'} in ${formatLocaleLabel(locale)}`;
        if (count === 0) cell.classList.add('zero');
        cells.appendChild(cell);
    });
    return cells;
}

function createTreeLine(count, row, localeCells = null) {
    const line = document.createElement('div');
    line.className = 'msm-line tree-line';
    const cell = document.createElement('div');
    cell.className = 'tree-count';
    if (count !== null) {
        const pill = document.createElement('span');
        pill.className = 'tree-count-pill';
        pill.textContent = count.toLocaleString();
        cell.appendChild(pill);
    }
    line.append(cell, row);
    if (localeCells) line.append(localeCells);
    return line;
}

function createPageRow(pageKey, depth) {
    const row = document.createElement('div');
    row.className = 'tree-row page';
    row.style.paddingLeft = `${12 + depth * 20}px`;

    const checkbox = createTreeCheckbox(pageKey, row, 'page');
    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = '📄';
    const name = document.createElement('span');
    name.className = 'tree-name';
    name.textContent = getPageLabelFromKey(pageKey);
    name.title = pageKey || '(locale root)';

    row.append(checkbox, icon, name);
    return createTreeLine(null, row, createLocaleCells(pageKey));
}

function populateChildren(container, pathSegments) {
    container.replaceChildren();
    const folderEntries = getFolderEntries(pathSegments);
    const leafPages = getDistinctPathsUnderPath(pathSegments, true);

    if (folderEntries.length === 0 && leafPages.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'tree-empty';
        empty.textContent = siteData.diffOnly ? 'No locale differences here' : 'No pages here';
        container.appendChild(empty);
        return;
    }

    folderEntries.forEach(([name, count]) => {
        container.appendChild(createFolderNode([...pathSegments, name], count));
    });
    leafPages.forEach((pageKey) => {
        container.appendChild(createPageRow(pageKey, pathSegments.length));
    });
}

function createFolderNode(pathSegments, count) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    node.dataset.folderPath = pathSegments.join('/');
    const depth = pathSegments.length - 1;

    const row = document.createElement('div');
    row.className = 'tree-row folder';
    row.style.paddingLeft = `${12 + depth * 20}px`;

    const checkbox = createTreeCheckbox(pathKey(pathSegments), row, 'folder');
    const disclosure = document.createElement('button');
    disclosure.type = 'button';
    disclosure.className = 'disclosure';
    disclosure.textContent = '▶';
    disclosure.setAttribute('aria-expanded', 'false');

    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = '📁';
    const name = document.createElement('span');
    name.className = 'tree-name';
    name.textContent = pathSegments[pathSegments.length - 1];

    row.append(checkbox, disclosure, icon, name);

    const children = document.createElement('div');
    children.className = 'tree-children';
    children.hidden = true;

    disclosure.addEventListener('click', () => {
        const expanded = disclosure.getAttribute('aria-expanded') === 'true';
        if (expanded) {
            collapseFolderNode(node);
            if (isFolderPathPrefix(pathSegments, siteData.openFolder)) {
                siteData.openFolder = [];
                updateMsmUrl({ folder: [] });
            }
        } else {
            expandFolderNode(node, pathSegments);
            setOpenFolder(pathSegments);
        }
    });

    node.append(createTreeLine(count, row, createLocaleCountCells(pathSegments, false)), children);
    return node;
}

function expandFolderNode(node, pathSegments) {
    const disclosure = node.querySelector('.tree-row.folder .disclosure');
    const children = node.querySelector(':scope > .tree-children');
    if (!disclosure || !children) return false;
    if (!children.dataset.loaded) {
        populateChildren(children, pathSegments);
        children.dataset.loaded = 'true';
    }
    disclosure.textContent = '▼';
    disclosure.setAttribute('aria-expanded', 'true');
    children.hidden = false;
    return true;
}

function collapseFolderNode(node) {
    const disclosure = node.querySelector('.tree-row.folder .disclosure');
    const children = node.querySelector(':scope > .tree-children');
    if (!disclosure || !children) return;
    disclosure.textContent = '▶';
    disclosure.setAttribute('aria-expanded', 'false');
    children.hidden = true;
}

function findFolderChildNode(container, folderName) {
    return [...container.children].find((child) => {
        if (!child.classList?.contains('tree-node')) return false;
        return child.dataset.folderPath?.split('/').pop() === folderName;
    });
}

function restoreOpenFolder() {
    const pathSegments = siteData.openFolder;
    if (!pathSegments.length || !siteData.lines.length) return;

    let container = document.getElementById('tree-root');
    for (let i = 0; i < pathSegments.length; i += 1) {
        const prefix = pathSegments.slice(0, i + 1);
        const folderName = pathSegments[i];
        const node = findFolderChildNode(container, folderName);
        if (!node) {
            siteData.openFolder = [];
            updateMsmUrl({ folder: [] });
            return;
        }
        if (!expandFolderNode(node, prefix)) return;
        container = node.querySelector(':scope > .tree-children');
        if (!container) return;
    }
}

function renderLocaleHeader() {
    const header = document.getElementById('msm-header');
    header.replaceChildren();
    if (!siteData.locales.length) {
        header.hidden = true;
        return;
    }
    header.hidden = false;
    const spacer = document.createElement('div');
    spacer.className = 'msm-header-cell';
    spacer.style.gridColumn = '1';
    const structure = document.createElement('div');
    structure.className = 'msm-header-cell structure';
    structure.textContent = 'Structure';
    header.append(spacer, structure);
    siteData.locales.forEach((locale, index) => {
        const cell = document.createElement('div');
        cell.className = 'msm-header-cell locale';
        cell.style.gridColumn = String(3 + index);
        const name = document.createElement('span');
        name.className = 'locale-header-name';
        name.textContent = formatLocaleLabel(locale);
        const total = document.createElement('span');
        total.className = 'locale-header-count';
        total.textContent = (siteData.localeTotals.get(locale) || 0).toLocaleString();
        cell.append(name, total);
        cell.title = `${locale}: ${total.textContent} paths`;
        header.appendChild(cell);
    });
}

function renderTree() {
    const grid = document.getElementById('msm-grid');
    const container = document.getElementById('tree-root');
    grid.style.setProperty('--locale-count', siteData.locales.length);
    grid.classList.toggle('has-locales', siteData.locales.length > 0);
    updateDiffOnlyToggle();
    updateLocalePrefixControl();
    updateTotalPathsDisplay();
    renderLocaleHeader();
    container.replaceChildren();

    if (siteData.lines.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'tree-empty';
        empty.textContent = siteData.loading
            ? 'Discovering URLs…'
            : 'Enter a sitemap URL above to get started';
        container.appendChild(empty);
        return;
    }

    populateChildren(container, []);
    restoreOpenFolder();
    updateSelectionUI();
}

document.getElementById('copy-selected-btn').addEventListener('click', () => {
    copySelectedUrls();
});

document.getElementById('diff-only').addEventListener('change', (e) => {
    siteData.diffOnly = e.target.checked;
    updateMsmUrl({ diffOnly: siteData.diffOnly });
    renderTree();
});

document.getElementById('locale-prefix').addEventListener('change', (e) => {
    siteData.localeDepth = Number(e.target.value);
    updateMsmUrl({ localePrefix: siteData.localeDepth });
    if (!siteData.lines.length) return;
    rebuildSiteModel();
    updateTotalPathsDisplay();
    updateLocaleMeta();
    updateDiffOnlyToggle();
    renderTree();
});

function syncMsmStateFromUrl() {
    siteData.diffOnly = readDiffOnlyFromUrl();
    siteData.openFolder = readFolderFromUrl();
    siteData.localeDepth = readLocaleDepthFromUrl();
    document.getElementById('diff-only').checked = siteData.diffOnly;
    updateLocalePrefixControl();
    if (siteData.lines.length) {
        rebuildSiteModel();
        updateTotalPathsDisplay();
        updateLocaleMeta();
        updateDiffOnlyToggle();
    }
    renderTree();
}

window.addEventListener('popstate', () => {
    syncMsmStateFromUrl();
});

siteData.index = createIndexNode();
siteData.diffOnly = readDiffOnlyFromUrl();
siteData.openFolder = readFolderFromUrl();
siteData.localeDepth = readLocaleDepthFromUrl();
document.getElementById('diff-only').checked = siteData.diffOnly;
updateLocalePrefixControl();
const params = new URLSearchParams(window.location.search);
if (params.get('url')) {
    document.getElementById('url').value = params.get('url');
    document.getElementById('input-form').dispatchEvent(new Event('submit'));
}
