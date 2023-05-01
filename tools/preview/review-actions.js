export async function addPageToReview(pathname, reviewId, env) {
  console.log(`Add ${pathname} to ${reviewId}`);
  console.log(env);
}

export async function removePageFromReview(pathname, reviewId, env) {
  console.log(`Remove ${pathname} to ${reviewId}`);
  console.log(env);
}

export async function updateReview(pathnames, reviewId, env) {
  console.log(`Update Review ${reviewId} with ${pathnames.length} pages`);
  console.log(pathnames);
  console.log(env);
}

export async function submitForReview(reviewId, env) {
  console.log(`Submit Review ${reviewId}`);
  console.log(env);
}

export async function openReview(reviewId, description, env) {
  console.log(`Open Review ${reviewId}, ${description}`);
  console.log(env)

}

export async function rejectReview(reviewId, env) {
  console.log(`Reject Review ${reviewId}`);
  console.log(env);
}

export async function approveReview(reviewId, env) {
  console.log(`Approve Review ${reviewId}`);
  console.log(env);
}
