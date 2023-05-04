import { 
  addPageToReview, 
  getReviewEnv, 
  getReviews, 
  approveReview, 
  rejectReview, 
  submitForReview,
  removePageFromReview, 
} from './review-actions.js';

async function getReviewStatus() {
  const reviews = await getReviews();
  if (reviews.length === 1 && reviews[0].reviewId === 'default') return reviews[0].status;
  else return ('open');
}

async function getPageStatus() {
  const reviews = await getReviews();
  const review = reviews.find((r) => r.pages.includes(window.location.pathname));
  if (review) return review.status;
  return '';
}

async function getPageReview() {
  const reviews = await getReviews();
  const review = reviews.find((r) => r.pages.includes(window.location.pathname));
  return review;
}

async function getOpenReviews() {
  const reviews = await getReviews();
  return reviews.filter((r) => r.status === 'open');
}

async function previewMode(plugins) {
  const setReviewStatus = (pageStatus, reviewStatus) => {
    const env = getReviewEnv();
    checkbox.checked = !!pageStatus;
    checkbox.disabled = (reviewStatus === 'submitted');
    let statusText;
    if (pageStatus === 'open') {
      statusText = `Ready for Review`;
      switcher.className = 'switch open';
    }
    if (pageStatus === 'submitted') {
      statusText = `Submitted for Review`;
      switcher.className = 'switch submitted'
    }
    if (pageStatus === '') {
      statusText = `Not in Review`;
      switcher.className = 'switch'
    }

    label.innerHTML = `<a target="_blank" href="https://default--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}">${statusText}</a>`;

  }

  let pageStatus = await getPageStatus();
  let reviewStatus = await getReviewStatus();

  const div = document.createElement('div');
  div.className = 'review';
  div.innerHTML = `
    <label class="switch"><input type="checkbox"><span class="slider round"></span></label>
    <span class="review-status">Not In Review</span><span></span>`;
  
  const checkbox = div.querySelector('input');
  const label = div.querySelector('.review-status');
  const switcher = div.querySelector('.switch');

  setReviewStatus(pageStatus, reviewStatus);

  checkbox.addEventListener('change',  async () => {
    console.log(checkbox.checked);
    if (checkbox.checked) {
      const openReviews = await getOpenReviews();
      console.log(openReviews);
      if (openReviews.length === 1) {
        await addPageToReview(window.location.pathname, openReviews[0].reviewId);
      }
    } else {
      const review = await getPageReview();
      await removePageFromReview(window.location.pathname, review.reviewId);
    }
    pageStatus = checkbox.checked ? 'open' : '';
    setReviewStatus(pageStatus, reviewStatus);
  })

  plugins.append(div);
}

async function openManifest(sk) {
  const env = getReviewEnv()
  const reviews = await getReviews();
  console.log(reviews);
  console.log(env);
  const review = reviews.find((r) => r.reviewId === env.review);

  const dialog = document.createElement('dialog'); 
  dialog.className = 'hlx-dialog';
  const edit = review.status === 'open' ? `<textarea rows="10">${review.pages.map((path) => `https://${env.ref}--${env.repo}--${env.owner}.hlx.page${path}`).join('\n')}</textarea><button id="hlx-update-manifest">Update Manifest</button>` : '';
  const buttons = review.status === 'open' ? `<button id="hlx-submit">Submit For Review</button>` : `<button id="hlx-approve">Approve Review</button> <button id="hlx-reject">Reject Review</button>`;
  const pages = review.pages.map((path) => `<p class="hlx-row"><a href="${path}">https://${env.review}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${path}</a></p>`)
  dialog.innerHTML = `
    <form method="dialog">
      <button class="hlx-close-button">X</button>
    </form>
    <h3>Manifest for ${review.reviewId} (${review.status})</h3>
    <p>${review.description}</p>
    <p>${buttons}</p>
    ${pages.join('')}
    <hr>
    ${edit}
  `;
  const update = dialog.querySelector('#hlx-update-manifest');
  if (update) {
    update.addEventListener('click', () => {
      const ta = dialog.querySelector('textarea');
      const pages = ta.value.split('\n').map((url) => new URL(url, window.location.href).pathname);
      updateReview(pages, review.reviewId, env);
    });
  }

  const verbs = [{id: 'reject', f: rejectReview}, {id: 'approve', f: approveReview}, {id: 'submit', f: submitForReview}]
    
  verbs.forEach((verb) => {
    const env = getReviewEnv();
    const button = dialog.querySelector(`#hlx-${verb.id}`);
    if (button) button.addEventListener('click', async () => {
      await verb.f(review.reviewId);
      dialog.close();
      if (verb.id === 'approve') {
        window.location.href=`https://${env.ref}--${env.repo}--${env.owner}.hlx.live${window.location.pathname}`;
      } else {
        window.location.reload();
      }
    });  
  });

  sk.shadowRoot.append(dialog);
  dialog.showModal();
}


async function reviewMode(plugins, sk) {
  const reviewStatus = await getReviewStatus();
  console.log(reviewStatus);
  const div = document.createElement('div');
  if (reviewStatus === 'open') {
    div.className = 'review-status open';
    div.innerHTML = '<span class="badge-unlocked"></span><span>Preparing for Review</span>';
  }
  if (reviewStatus === 'submitted') {
    div.className = 'review-status submitted';
    div.innerHTML = '<span class="badge-locked"></span><span>Review Submitted</span>'
  }
  plugins.append(div);
  div.addEventListener('click', () => {
    openManifest(sk);
  })
}

async function decorateSidekick(sk) {
  const { state } = getReviewEnv();
  const plugins = sk.shadowRoot.querySelector('.plugin-container');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/tools/sidekick/review.css';

  sk.shadowRoot.append(link);

  if (state === 'page') previewMode(plugins);
  if (state === 'reviews') reviewMode(plugins, sk);
}

export default async function init() {
  const catchSk = () => {
    const sk = document.querySelector('helix-sidekick');
    if (sk) decorateSidekick(sk);
    else setTimeout(catchSk, 1000); 
  }
  setTimeout(catchSk, 1000);     
}




