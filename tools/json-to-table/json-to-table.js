function flattenJSON (obj = {}, res = {}, extraKey = '') {
    for(key in obj){
       if(typeof obj[key] !== 'object'){
          res[extraKey + key] = obj[key];
       } else {
          flattenJSON(obj[key], res, `${extraKey}${key}.`);
       };
    };
    return res;
 };

 function cleanUp (obj) {
    const res = {};
    const keys = Object.keys(obj);
    keys.forEach((key) => {
        const pathOverride = key.endsWith('._path') && (key.split('_').length === 2);
        const isHidden = key.includes('_');

        if (!isHidden || pathOverride) {
            const cleanKey = key.replaceAll('.0.', '.');
            res[cleanKey] = obj[key];
        }
    });
    return (res);
 }

async function fetchCatalog() {
    //const uri = encodeURIComponent('https://odin.adobe.com/content/dam/ccsurfaces/AppCatalog/en_US/experienceAppsCatalog/CCDesktop-Full-App-Catalog.cfm.gql.json');
    const resp = await fetch(`./catalog.json`);
    const json = await resp.json();
    return (json);
}

function escapeChars(string) {
    const escaped = string.replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t');
    return escaped;
}

function toTable(apps) {
    const columns = [
        'name',
        'sapCode',
        'fulfillmentCode',
        'layoutID',
        'buyUrlForCch.pdp',
        'buyUrlForCch.allApps',
        'buyUrlForCch.category',
        'bannerImage._path',
        'inAppID',
        'layoutID',
        'rotationTime',
        'numberOfRotations',
        'muteVideo',
        'showControls',
        'overviewTitle',
        'overview.plaintext',
        'tutorialTitle',
        'moreTutorialsLink.url',
        'behanceTitle',
        'moreBehanceLink.url',
        'supportedLanguages',
        'troubleshootLink.url',
        'contactUsLink.url',
        'communityLink.url',
        'relatedApps',
        'compatibilityUrl.url',
        'qrCodeCch._path',
        'qrCodeCcd._path',
        'bannerVideo.mp4',
    ];

    const lists = {
        bannerList: {
            table: [[
                'id',
                'itemList._path',
                'itemList.backgroundColor',
                'itemList.colorTextList.0',
                'itemList.imageList._path',
                'itemList.imageList.height',
                'itemList.imageList.mimeType',
                'itemList.imageList.type',
                'itemList.imageList.width',
                'itemList.layoutID',
                'itemList.locReady',
                'itemList.name',
                'layoutID',
                'name',
            ]],
        },
        keyFeatureList: {
            table: [[
                'id',
                'title',
                'description.plaintext',
                'name',
                'asset._path',
            ]],
        },
        tutorialList: {
            table: [[
                'id',
                'name',
                'image._path',
                'numberOfTutorials',
                'durationInMinutes',
                'link.url',
                'link.name',
                'link.title',
            ]],
        },
        behanceList: {
            table: [[
                'id',
                'name',
                'creator',
                'image._path',
                'link.url',
                'link.name',
                'link.title',
            ]],
        },
        socialLinks: {
            table: [[
                'id',
                'name',
                'link',
            ]],
        },
        shortcutList: {
            table: [[
                'id',
                'title',
                'shortcutIcon.name',
                'shortcutIcon.spectrumID',
                'shortcutIcon.customIconId',
                'shortcutIcon.icon._path',
                'shortcutLink.url',
                'shortcutLink.name',
            ]],
        },
    };

    const table = [];
    table.push(columns);
    apps.forEach((app) => {
        const row = [];
        columns.forEach((col) => {
            if (col === 'supportedLanguages') {
                row.push(app[col].map((lang) => lang.languageId).join(', '));
            } else if (col === 'relatedApps') {
                row.push(app[col] ? app[col].join(', ') : '')
            } else if (col.includes('.')) {
                const [top, sub] = col.split('.');
                const value = (app[top] ? app[top][sub] : '') || '';
                row.push(escapeChars(''+value));
            } else {
                row.push(app[col] ? escapeChars(''+app[col]) : '');
            }
        });
        table.push(row);

        Object.keys(lists).forEach((listKey) => {
            const list = lists[listKey];
            const columns = list.table[0];
            if (app[listKey]) {
                const listObj = listKey === 'bannerList' ? app[listKey][listKey] : app[listKey];
                listObj.forEach((item) => {
                    const flat = flattenJSON(item);
                    const clean = cleanUp(flat);
                    const row = []
                    columns.forEach((col) => {
                        if (col === 'id') {
                            row.push(app.name);
                        } else {
                            row.push(escapeChars(''+(clean[col] || '')));
                        }
                    });
                    list.table.push(row);
                })
            }
        })
    });
    //console.log(table);

    let output = table.map((row) => row.join('\t')).join('\n')+'\n\n';
    Object.keys(lists).forEach((listKey) => {
        const list = lists[listKey];
        output += list.table.map((row) => row.join('\t')).join('\n')+'\n\n';
    });

    return output;
}

async function convert() {
    const json = await fetchCatalog();
    const apps = json.data.experienceAppsCatalogByPath.item.appsPdpList;
    const textarea = document.querySelector('textarea');
    textarea.value = toTable(apps);
}

convert();