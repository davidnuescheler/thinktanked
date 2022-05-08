
function drop() {
    const div = document.createElement('div');
    div.innerHTML = '<h1>H1</h1><h2>H2</h2><h3></h3><h4></h4><h5></h5><h6></h6><a href="#">Link</a>';
    const h2 = document.querySelector('h2');
    h2.parentElement.insertBefore(div, h2);

    const vars = {};
    const sizes = ['xxl', 'xl', 'l', 'm', 's', 'xs', 'xxs'];

    for (let i = 1; i < 7; i += 1) {
        const h = div.querySelector(`h${i}`);
        const hstyle = window.getComputedStyle(h);
        vars[`heading-font-size-${sizes[i-1]}`] = hstyle.getPropertyValue('font-size');
    }

    const psizes = {};
    document.querySelectorAll('p').forEach((p) => {
      const pstyle = window.getComputedStyle(p);
      const size = pstyle.getPropertyValue('font-size');
      psizes[size] = psizes[size] ? psizes[size] + 1 : 1;
    });

    const pskeys = Object.keys(psizes);
    const max = Math.max(...pskeys.map(k => psizes[k]));
    const sizeM = +pskeys.find((k) => psizes[k]).replace('px', '');
    let numSizes = pskeys.map((s) => +s.replace('px', '')).sort((a, b) => b - a);
    let offset = numSizes.indexOf(sizeM);
    if (offset > 3) {
      numSizes = numSizes.slice(offset - 3);
      offset = 3;
    }
    let bodySizes = '';
    const sizeNames = sizes.slice(3 - offset);
    numSizes.forEach((size, i) => {
      vars[`body-font-size-${sizeNames[i]}`] = `${size}px`;
      bodySizes += `  --body-font-size-${sizeNames[i]}: ${size}px
`;
    });

    const h1 = div.querySelector('h1');
    const h1style = window.getComputedStyle(h1);
    vars['heading-font-family'] = h1style.getPropertyValue('font-family');
    
    const p = document.body.querySelector('p');
    const pstyle = window.getComputedStyle(p);
    vars['body-font-family'] = pstyle.getPropertyValue('font-family');

    const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`


    const link = div.querySelector('a');
    const linkStyle = window.getComputedStyle(link);
    vars['link-color'] = rgb2hex(linkStyle.getPropertyValue('color'));
    const linkHoverStyle = window.getComputedStyle(link, ':hover');
    vars['link-hover-color'] = rgb2hex(linkHoverStyle.getPropertyValue('color'));


console.log(`
  /* colors */
  --link-color: ${vars['link-color']};
  --link-hover-color: ${vars['link-hover-color']};
  --background-color: #fff;
  --overlay-background-color: #eee;
  --highlight-background-color: #ccc;
  --text-color: #000;

  /* fonts */
  --body-font-family: ${vars['body-font-family']};
  --heading-font-family: ${vars['heading-font-family']};
  --fixed-font-family: 'Roboto Mono', menlo, consolas, 'Liberation Mono', monospace;

  /* body sizes */
${bodySizes}

  /* heading sizes */
  --heading-font-size-xxl: ${vars['heading-font-size-xxl']};
  --heading-font-size-xl: ${vars['heading-font-size-xl']};
  --heading-font-size-l: ${vars['heading-font-size-l']};
  --heading-font-size-m: ${vars['heading-font-size-m']};
  --heading-font-size-s: ${vars['heading-font-size-s']};
  --heading-font-size-xs: ${vars['heading-font-size-xs']};
`);

}

drop();

