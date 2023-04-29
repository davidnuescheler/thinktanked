function createTag(name, attrs) {
    const el = document.createElement(name);
    if (typeof attrs === 'object') {
      for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
      }
    }
    return el;
  }

async function fetchDrinks(name) {
    const resp = await fetch ('/drinks.json');
    const json = await resp.json();
    return json[name];
}


async function displayDrinks($block) {
    const name = $block.textContent.trim().toLowerCase();
    $block.innerHTML = '';
    const drinks = await fetchDrinks(name);
    drinks.data.forEach((row) => {
        const $row = createTag('div', { class: 'drink'});
        console.log(row);
        const recipe = row.Recipe.includes(',') ? row.Recipe.split(',').join('<br>') : row.Recipe.split('\n').join('<br>');
        $row.innerHTML = `<div class="name"><h3>${row.Drink}</h3></div>
        <div class="recipe">${recipe}</div>
        <div class="glass">${row.Glass}</div>`;
        $block.appendChild($row);
    })
} 

export default function decorate($block) {
    displayDrinks($block);
}