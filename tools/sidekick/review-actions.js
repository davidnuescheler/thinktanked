/* eslint-disable no-console */
import { getMetadata } from '../../scripts/lib-franklin.js';

export const SidekickState = {};

export function getReviewEnv() {
  let { hostname } = window.location;
  if (hostname === 'localhost') {
    try {
      hostname = new URL(getMetadata('hlx:proxyUrl')).hostname;
      hostname = 'default--reviews--thinktanked--davidnuescheler.hlx.reviews';
    } catch (e) {
      hostname = 'default--reviews--thinktanked--davidnuescheler.hlx.reviews';
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

function toReview(snapshot) {
  const review = {
    reviewId: snapshot.id,
    status: snapshot.locked ? 'submitted' : 'open',
  };
  if (snapshot.resources) {
    review.pages = snapshot.resources.map((r) => r.path);
  }
  return (review);
}

export async function getReviews() {
  const resp = await fetch(`/.snapshots/default/.manifest.json?ck=${Math.random()}`, {
    cache: 'no-store',
  });
  const snapshot = await resp.json();
  const review = toReview(snapshot);
  return ([review]);
}

async function getReview(reviewId) {
  const resp = await fetch(`/.snapshots/${reviewId}/.manifest.json?ck=${Math.random()}`, {
    cache: 'no-store',
  });

  const json = await resp.json();
  const review = toReview(json);
  return review;
}

async function isReviewOpen(reviewId) {
  const { status } = await getReview(reviewId);
  console.log(`${reviewId} status: ${status}`);
  return (status === 'open');
}

async function publishSnapshot(pathname, reviewId, env) {
  const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}?publish=true`;
  console.log(snapshotEndpoint);
  const snapshotResp = await fetch(snapshotEndpoint, {
    method: 'POST',
  });
  const snapshotText = await snapshotResp.text();
  console.log(snapshotText);
}

async function addPageToSnapshot(pathname, reviewId, env) {
  const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}${pathname}`;
  console.log(snapshotEndpoint);
  const snapshotResp = await fetch(snapshotEndpoint, {
    method: 'POST',
  });
  const snapshotText = await snapshotResp.text();
  console.log(snapshotText);
}

export async function addPageToReview(page, reviewId) {
  const env = getReviewEnv();
  console.log(`Add ${page} to ${reviewId}`);
  console.log(env);
  if (isReviewOpen(reviewId)) {
    console.log('Adding to snapshot');
    const [pathname] = page.split('?');
    addPageToSnapshot(pathname, reviewId, env);
  } else {
    console.log('Review is not open');
  }
}

export async function removePageFromReview(page, reviewId) {
  const env = getReviewEnv();
  console.log(`Remove ${page} from ${reviewId}`);
  console.log(env);
  if (isReviewOpen(reviewId)) {
    console.log('Removing from snapshot');
    const [pathname] = page.split('?');
    const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}${pathname}`;
    console.log(snapshotEndpoint);
    const snapshotResp = await fetch(snapshotEndpoint, {
      method: 'DELETE',
    });
    const snapshotText = await snapshotResp.text();
    console.log(snapshotText);
  } else {
    console.log('Review is not open');
  }
}

export async function updateReview(pages, reviewId) {
  const env = getReviewEnv();
  console.log(`Update Review ${reviewId} with ${pages.length} pages`);
  console.log(pages);
  console.log(env);

  if (isReviewOpen(reviewId)) {
    console.log('Clearing Pages');
    const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}/*`;
    console.log(snapshotEndpoint);
    const snapshotResp = await fetch(snapshotEndpoint, {
      method: 'DELETE',
    });
    const snapshotText = await snapshotResp.text();
    console.log(snapshotText);
  } else {
    console.log('Review is not open');
  }
}

export async function submitForReview(reviewId) {
  const env = getReviewEnv();
  console.log(`Submit Review ${reviewId}`);
  console.log(env);
  const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}?locked=true`;
  console.log(snapshotEndpoint);
  const snapshotResp = await fetch(snapshotEndpoint, {
    method: 'POST',
  });
  const snapshotText = await snapshotResp.text();
  console.log(snapshotText);
}

export async function openReview(reviewId, description) {
  const env = getReviewEnv();
  console.log(`Open Review ${reviewId}, ${description}`);
  console.log(env);
  const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}`;
  console.log(snapshotEndpoint);
  const snapshotResp = await fetch(snapshotEndpoint, {
    method: 'POST',
  });
  const snapshotText = await snapshotResp.text();
  console.log(snapshotText);
}

export async function rejectReview(reviewId) {
  const env = getReviewEnv();
  console.log(`Reject Review ${reviewId}`);
  console.log(env);
  const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}?locked=false`;
  console.log(snapshotEndpoint);
  const snapshotResp = await fetch(snapshotEndpoint, {
    method: 'POST',
  });
  const snapshotText = await snapshotResp.text();
  console.log(snapshotText);
}

export async function approveReview(reviewId) {
  const env = getReviewEnv();
  console.log(`Approve Review ${reviewId}`);
  console.log(env);

  const review = await getReview(reviewId);
  if (review && review.status === 'submitted') {
    console.log(review);
    const pathnames = review.pages.map((page) => page.split('?')[0]);
    console.log(pathnames);
    for (let i = 0; i < pathnames.length; i += 1) {
      const pathname = pathnames[i];
      console.log('Publishing from snapshot');
      console.log(pathname);
      // eslint-disable-next-line no-await-in-loop
      await publishSnapshot(pathname, reviewId, env);
    }

    console.log('Clearing Pages');
    const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}/*`;
    console.log(snapshotEndpoint);
    const snapshotResp = await fetch(snapshotEndpoint, {
      method: 'DELETE',
    });
    const snapshotText = await snapshotResp.text();
    console.log(snapshotText);
  } else {
    console.log('Review is not submitted');
  }
}
