/* eslint-disable no-console */
import { getMetadata } from '../../scripts/lib-franklin.js';

export function getReviewEnv() {
  let { hostname } = window.location;
  if (hostname === 'localhost') {
    try {
      hostname = new URL(getMetadata('hlx:proxyUrl')).hostname;
    } catch (e) {
      hostname = 'default--reviews--aempenbrayacomingsooncom--pfizer.hlx.reviews';
    }
  }

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
  const resp = await fetch(`${endpoint}?page=${encodeURIComponent(pathname)}`, {
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
  const resp = await fetch(`${endpoint}?page=${encodeURIComponent(pathname)}`, {
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
  try {
    const env = getReviewEnv();
    console.log(`Submit Review ${reviewId}`);
    console.log(env);
    const endpoint = getEndpoint(reviewId, 'submit');
    const resp = await fetch(endpoint, {
      method: 'POST',
    });
    const text = await resp.text();
    console.log(text);
    return true;
  } catch (e) {
    // ignore
  }
  return false;
}

export async function openReview(reviewId, description) {
  try {
    const env = getReviewEnv();
    console.log(`Open Review ${reviewId}, ${description}`);
    console.log(env);
    const endpoint = getEndpoint(reviewId, '');
    const resp = await fetch(`${endpoint}?description=${description}`, {
      method: 'POST',
    });
    const text = await resp.text();
    console.log(text);
    return true;
  } catch (e) {
    // ignore
  }
  return false;
}

export async function rejectReview(reviewId) {
  try {
    const env = getReviewEnv();
    console.log(`Reject Review ${reviewId}`);
    console.log(env);
    const endpoint = getEndpoint(reviewId, 'reject');
    const resp = await fetch(endpoint, {
      method: 'POST',
    });
    const text = await resp.text();
    console.log(text);
    return true;
  } catch (e) {
    // ignore
  }
  return false;
}

async function publish(path, env) {
  const { owner, repo, ref } = env;
  const publishPath = new URL(path, window.location.href).pathname;
  console.log(`publishing ${publishPath}`);
  let resp = {
    ok: false,
  };
  try {
    resp = await fetch(
      `https://admin.hlx.page/live/${owner}/${repo}/${ref}${publishPath}`,
      {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
      },
    );
  } catch (e) {
    console.error('failed to publish', publishPath, e);
  }
  resp.path = publishPath;
  resp.error = (resp.headers && resp.headers.get('x-error')) || '';
  return resp;
}

export async function approveReview(reviewId) {
  const env = getReviewEnv();
  console.log(`Approve Review ${reviewId}`);
  console.log(env);
  const review = (await getReviews()).find((r) => r.reviewId === reviewId);
  if (review) {
    // publish all pages in review
    const { pages } = review;
    const { processQueue } = await import('./process-queue.js');
    const results = [];
    await processQueue(pages, async (path) => {
      results.push(await publish(path, env));
    }, 40);
    console.log(results);

    const errors = results.filter((res) => !res.ok);
    if (errors.length > 0) {
      const errPaths = errors.map((e) => e.path);
      const msg = `The following pages could not be published:\n\n${errPaths.join('\n')}`;
      // eslint-disable-next-line no-alert
      window.alert(msg);
      return false;
    }

    // set review to approved
    // const endpoint = getEndpoint(reviewId, 'approve');
    // const resp = await fetch(endpoint, {
    //   method: 'POST',
    // });
    // const text = await resp.text();
    // console.log(text);
    return true;
  }
  console.error(`Review with ID "${reviewId}" not found`);
  return false;
}
