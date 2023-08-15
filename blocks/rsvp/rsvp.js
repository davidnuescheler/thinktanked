export default function decorate(block) {
  const sheet = new URL(block.textContent).pathname.split('.')[0];
  const guestName = new URLSearchParams(window.location.search).get('guest') || '';
  block.innerHTML = `
    <form>
    <input name="Name" type="text" value="${guestName}">
    <select name="Guests">
    <option value="1">Coming Solo</option>
    <option value="2">Just the two of us</option>
    <option value="3">We are three</option>
    <option value="4">We are four</option>
    <option value="5">We are five or more</option>
    </select>
    <div class="rsvp-buttons">
    <input type="submit" value="RSVP">
    <input type="button" value="Sorry, can't make it!">
    </div>
    </form>
  `;

  const numNames = guestName.replace(/[^A-Z]/g, '').length;
  block.querySelector('select').children[numNames - 1].selected = true;
  /* submit */
  block.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const response = await fetch(sheet, {
      method: 'POST',
      body: JSON.stringify({ data }),
      headers: {
        'content-type': 'application/json',
      },
    });
    if (response.ok) {
      block.innerHTML = `
        <div class="rsvp-check"></div>
        <h2>${data.Name}, thank you for your RSVP!</h2>
        <p>You are on the list.</p>
      `;
    } else {
      console.error('Error submitting RSVP');
    }
  });

  /* cancel */
  block.querySelector('input[type="button"]').addEventListener('click', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target.closest('form'));
    const data = Object.fromEntries(formData.entries());
    data.Guests = '0';
    const response = await fetch(sheet, {
      method: 'POST',
      body: JSON.stringify({ data }),
      headers: {
        'content-type': 'application/json',
      },
    });
    if (response.ok) {
      block.innerHTML = `
        <div class="rsvp-check"></div>
        <h2>${data.Name}, we're sorry you can't make it!</h2>
        <p>We'll miss you! ...maybe on my 60th?</p>
      `;
    } else {
      console.error('Error submitting RSVP');
    }
  });
}
