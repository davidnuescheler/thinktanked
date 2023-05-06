export function getReviewEnv() {
  let { hostname } = window.location;
  if (hostname === 'localhost') hostname = 'default--main--thinktanked--davidnuescheler.hlx.reviews';

  const [env, , state] = hostname.split('.');
  const splits = env.split('--');
  let review;
  if (splits.length === 4) review = splits.shift();
  const [ref, repo, owner] = splits;
  return {
    review, ref, repo, owner, state,
  };
}

function getEndpoint(reviewId, verb) {
  const env = getReviewEnv();
  return `https://${reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews/admin/${verb}`;
}

export async function getReviews() {
  const env = getReviewEnv();
  const adminHost = env.review ? `${env.review}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews` : `${env.ref}--${env.repo}--${env.owner}.hlx.reviews`;
  const resp = await fetch(`https://${adminHost}/admin/?ck=${Math.random()}`, {
    cache: 'no-store',
  });
  const json = await resp.json();
  const reviews = json.data;
  reviews.forEach((review) => {
    review.pages = review.pages ? review.pages.split(',').map((p) => p.trim()) : [];
  });
  return (reviews);
}

export async function addPageToReview(pathname, reviewId) {
  const env = getReviewEnv();
  console.log(`Add ${pathname} to ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, 'add-page');
  const resp = await fetch(`${endpoint}?page=${window.location.pathname}`, {
    method: 'POST',
  });
  const text = await resp.text();
  console.log(text);
}

export async function removePageFromReview(pathname, reviewId) {
  const env = getReviewEnv();
  console.log(`Remove ${pathname} from ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, 'remove-page');
  const resp = await fetch(`${endpoint}?page=${window.location.pathname}`, {
    method: 'POST',
  });
  const text = await resp.text();
  console.log(text);
}

export async function updateReview(pathnames, reviewId) {
  const env = getReviewEnv();
  console.log(`Update Review ${reviewId} with ${pathnames.length} pages`);
  console.log(pathnames);
  console.log(env);
  const endpoint = getEndpoint(reviewId, '');
  const resp = await fetch(`${endpoint}?pages=${pathnames.join()}`, {
    method: 'POST',
  });
  const text = await resp.text();
  console.log(text);
}

export async function submitForReview(reviewId) {
  const env = getReviewEnv();
  console.log(`Submit Review ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, 'submit');
  const resp = await fetch(endpoint, {
    method: 'POST',
  });
  const text = await resp.text();
  console.log(text);
}

export async function openReview(reviewId, description) {
  const env = getReviewEnv();
  console.log(`Open Review ${reviewId}, ${description}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, '');
  const resp = await fetch(`${endpoint}?description=${description}`, {
    method: 'POST',
  });
  const text = await resp.text();
  console.log(text);
}

export async function rejectReview(reviewId) {
  const env = getReviewEnv();
  console.log(`Reject Review ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, 'reject');
  const resp = await fetch(endpoint, {
    method: 'POST',
  });
  const text = await resp.text();
  console.log(text);
}

export async function approveReview(reviewId) {
  const env = getReviewEnv();
  console.log(`Approve Review ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, 'approve');
  const resp = await fetch(endpoint, {
    method: 'POST',
  });
  const text = await resp.text();
  console.log(text);
}
