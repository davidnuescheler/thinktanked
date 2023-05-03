function getEndpoint(reviewId, env, verb) {
  return `https://${reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews/admin/${verb}`;
}

export async function addPageToReview(pathname, reviewId, env) {
  console.log(`Add ${pathname} to ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, env, 'add-page');
  const resp = await fetch(`${endpoint}?page=${window.location.pathname}`, {
    method: `POST`,
  });
  const text = await resp.text();
  console.log(text);
  window.location.reload();
}

export async function removePageFromReview(pathname, reviewId, env) {
  console.log(`Remove ${pathname} to ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, env, 'remove-page');
  const resp = await fetch(`${endpoint}?page=${window.location.pathname}`, {
    method: `POST`,
  });
  const text = await resp.text();
  console.log(text);
  window.location.reload();
}

export async function updateReview(pathnames, reviewId, env) {
  console.log(`Update Review ${reviewId} with ${pathnames.length} pages`);
  console.log(pathnames);
  console.log(env);
  const endpoint = getEndpoint(reviewId, env, '');
  const resp = await fetch(`${endpoint}?pages=${pathnames.join()}`, {
    method: `POST`,
  });
  const text = await resp.text();
  console.log(text);
  window.location.reload();
}

export async function submitForReview(reviewId, env) {
  console.log(`Submit Review ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, env, 'submit');
  const resp = await fetch(endpoint, {
    method: `POST`,
  });
  const text = await resp.text();
  console.log(text);
  window.location.reload();
}

export async function openReview(reviewId, description, env) {
  console.log(`Open Review ${reviewId}, ${description}`);
  console.log(env)
  const endpoint = getEndpoint(reviewId, env, '');
  const resp = await fetch(`${endpoint}?description=${description}`, {
    method: `POST`,
  });
  const text = await resp.text();
  console.log(text);
  window.location.reload();
}

export async function rejectReview(reviewId, env) {
  console.log(`Reject Review ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, env, 'reject');
  const resp = await fetch(endpoint, {
    method: `POST`,
  });
  const text = await resp.text();
  console.log(text);
  window.location.reload();
}

export async function approveReview(reviewId, env) {
  console.log(`Approve Review ${reviewId}`);
  console.log(env);
  const endpoint = getEndpoint(reviewId, env, 'approve');
  const resp = await fetch(endpoint, {
    method: `POST`,
  });
  const text = await resp.text();
  console.log(text);
  window.location.href=`https://${env.ref}--${env.repo}--${env.owner}.hlx.live${window.location.pathname}`;
}