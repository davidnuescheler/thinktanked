/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
} from '../../scripts/lib-franklin.js';
import {
  createPopupButton,
  getOverlay,
} from './preview.js';

function getContentBranch(job) {
  if (job.reviewId === 'review') return '/drafts/review';
  if (job.reviewId === 'editorial') return '/drafts/editorial';
  return (`/drafts/${job.status}/${job.reviewId}`);
}

function getRelativePath(pathname) {
  const removePrefix = (str, remove) => str.substring(remove.length);
  if (pathname.startsWith('/drafts/review')) return (removePrefix(pathname, '/drafts/review'));
  if (pathname.startsWith('/drafts/editorial')) return (removePrefix(pathname, '/drafts/editorial'));
  return pathname;
}

function createJob(job, reviewId, currentJob, env) {
  let buttons = '';
  if (currentJob && currentJob.reviewId === reviewId) {
    switch (job.status) {
      case 'submitted':
        buttons = '<br><p><a href="#">Reject Review</a> <a href="#">Publish</a><p>';
        break;
      default:
        buttons = '<br><p><a href="#">Submit for Review</a><p>';
    }
  }
  const isSelected = currentJob && currentJob.reviewId === reviewId;
  const actions = !isSelected ? [
    {
      label: 'View',
      // href: `${window.location.pathname}?content-branch=/drafts/${job.status}/${job.reviewId}`,
      href: `https://${job.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.${env.state}${window.location.pathname}`,
    },
  ] : [];
  return {
    label: `<code>${reviewId}</code>`,
    description: `
      <p>${job.description}</p>
      <p>Status: ${job.status}</p>${buttons}`,
    actions,
    isSelected,
  };
}

function getReviewEnv(hostname) {
  const [env, , state] = hostname.split('.');
  const splits = env.split('--');
  let review, ref, repo, owner;
  if (splits.length === 4) review = splits.shift();
  [ref, repo, owner] = splits;
  return { review, ref, repo, owner, state };
}

async function decorateJobSwitcherPill(overlay) {
  const resp = await fetch('/drafts/reviews.json');
  const json = await resp.json();
  const jobs = json.data;
  const currentJob = window.hlx.contentBranch
    ? jobs.find((e) => window.hlx.contentBranch.endsWith(e.reviewId)) : undefined;
  const jobName = currentJob ? `${currentJob.status}` : 'Production / Live';
  const hostname = 'review002--main--thinktanked--davidnuescheler.hlx.reviews'
  const env = getReviewEnv(hostname);
  console.log(env);

  const pill = createPopupButton(
    `${jobName}`,
    {
      label: 'Pick your environment',
      description: `
        <div class="hlx-details">
          Pick the job you would like to inspect below
        </div>`,
      actions: [
      ],
    },
    jobs.map((job) => createJob(job, job.reviewId, currentJob, env)),
  );
  pill.classList.add(currentJob ? `is-${currentJob.status}` : 'is-active');
  overlay.append(pill);
}

/**
 * Decorates Preview mode badges and overlays
 * @return {Object} returns a badge or empty string
 */
export default async function decorateJobSwitcherOverlay() {
  try {
    const overlay = getOverlay();
    await decorateJobSwitcherPill(overlay);
  } catch (e) {
    console.log(e);
  }
}
