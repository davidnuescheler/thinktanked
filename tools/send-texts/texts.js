const [$urls, submit, output] = [...document.querySelectorAll('.id')];

submit.addEventListener('click', () => {
  output.textContent = '';
  const rows = $urls.value.split('\n');
  rows.forEach((row) => {
    const [names, phones] = row.split('\t');
    const a = document.createElement('a');
    a.href = `sms:/open?addresses=${phones}&body=https://thinktanked.org/50/?guest=${encodeURIComponent(encodeURIComponent(names))}`;
    a.textContent = names;
    output.append(a);
  });
});
