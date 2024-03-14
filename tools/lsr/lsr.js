async function traverseCurrentFolder() {
  const URLs = [];
  const [prefix] = window.location.href.split('/Shared%20Documents/');
  const usp = new URLSearchParams(window.location.search);
  const rootPath = usp.get('id').split('/Shared Documents')[1];

  const traverseFolder = async (path) => {
    const getDirEntries = async (path, type) => {
      const apiURL = `${prefix}/_api/web/GetFolderByServerRelativeUrl('Shared%20Documents${path}')/${type}`;
      const resp = await fetch (apiURL);
      const xml = await resp.text();
      const dp = new DOMParser();
      const dom = dp.parseFromString(xml, 'text/xml');
      const entries = [...dom.querySelectorAll('ServerRelativeUrl')];
      return entries.map((e) => e.textContent.split('Shared Documents')[1]);
    }
  
    const getFiles = async (path) => await getDirEntries(path, 'Files');
    const getFolders = async (path) => await getDirEntries(path, 'Folders');
    const files = await getFiles(path);
    files.forEach((file) => {
      let cleanPath = '';
      if (file.endsWith('.docx')) cleanPath = file.split('.')[0].substring(rootPath.length);
      if (file.endsWith('.xlsx')) cleanPath = file.split('.')[0].substring(rootPath.length) + '.json';
      if (file.endsWith('.pdf')) cleanPath = file.split('.')[0].substring(rootPath.length) + '.pdf';

      cleanPath = cleanPath.toLowerCase();
      cleanPath = cleanPath.replaceAll(' ', '-');
      cleanPath = cleanPath.replaceAll('&', '-');
      cleanPath = cleanPath.replaceAll('\'', '-');
      cleanPath = cleanPath.replaceAll('--', '-');
      cleanPath = cleanPath.replaceAll('--', '-');
      cleanPath = cleanPath.replaceAll('--', '-');
  
      URLs.push(`${window.domainPrefix}${cleanPath}`);
    });
  
    const folders = await getFolders(path);  
    for (let i = 0; i < folders.length; i += 1) {
      const folder = folders[i];
      await traverseFolder(folder);
      console.log(URLs.length);
    }
  }
  await traverseFolder(rootPath);
  URLs.sort();
  console.log(URLs.join('\n'));
}

traverseCurrentFolder();