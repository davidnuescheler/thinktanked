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


function createAddToReview(review, env) {
  return {
    label: `Add this page to: ${review.reviewId}`,
    description: review.description,
    actions: [
      {
        label: 'Add',
        // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
        href: `javascript:https://${review.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.${env.state}${window.location.pathname}`,
      },
    ],
  };
}

function createRemoveFromReview(review, env) {
  return {
    label: `Remove this page from the review before submission`,
    actions: [
      {
        label: 'Remove',
        // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
        href: `javascript:https://${review.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.${env.state}${window.location.pathname}`,
      },
    ],
  };
}

function createReview(review, reviewId, currentReview, env) {
  const isSelected = currentReview && currentReview.reviewId === reviewId;
  let buttons = '';
  let actions = [
    {
      label: 'View',
      // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
      href: `https://${review.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.${env.state}${window.location.pathname}`,
    },
  ];

  if (isSelected) {
    actions = [ {
      label: 'Manage',
      // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
      href: `#`,
      click: () => {
        openManifest(currentReview, env);
      }    
      },
    ]

    switch (review.status) {
      case 'submitted':
        buttons = '<br><p><a href="#">Reject Review</a> <a href="#">Publish</a><p>';
        break;
      default:
        buttons = '<br><p><a href="#">Submit for Review</a></p>';
    }
  }

  return {
    label: `<code>${reviewId} (${review.status})</code>`,
    description: `
      <p>${review.description}</p>
      ${buttons}`,
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

function openManifest(review, env) {
  const dialog = document.createElement('dialog'); 
  dialog.className = 'hlx-dialog';
  const overlay = getOverlay();
  const edit = review.status === 'open' ? `<textarea rows="10">${review.pages.join('\n')}</textarea><button id="hlx-updateManifest">Update Manifest</button>` : '';

  const pages = review.pages.map((path) => `<p class="hlx-row"><a href="${path}">https://${env.review}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${path}</a></p>`)
  dialog.innerHTML = `
    <form method="dialog">
      <button class="hlx-close-button">X</button>
    </form>
    <h3>Manifest for ${review.reviewId} (${review.status})</h3>
    <p>${review.description}</p>
    ${pages.join('')}
    <hr>
    ${edit}
  `;
  overlay.append(dialog);
  dialog.showModal();
}

async function decoratereviewSwitcherPill(overlay) {
  const resp = await fetch('/drafts/reviews.json');
  const json = await resp.json();
  const reviews = json.data;
  reviews.forEach((review) => {
    review.pages = review.pages.split(',').map((p) => p.trim());
  });
  const hostname = window.location.hostname;
  // const hostname = 'review001--main--thinktanked--davidnuescheler.hlx.reviews'
  // const hostname = 'main--thinktanked--davidnuescheler.hlx.page'
  const env = getReviewEnv(hostname);
  const currentReview = env.review ? reviews.find((e) => env.review === e.reviewId) : undefined;
  const reviewMode = !!currentReview;

  const findPageInReviews = (pathname) => reviews.find((r) => reviews.pages.includes(pathname));
  
  if (reviewMode) {
    const reviewDisplay = currentReview.status ? `Submitted for Review: ${currentReview.reviewId}` : `Ready for Review: ${currentReview.reviewId}`;
  
    const pill = createPopupButton(
      `${reviewDisplay}`,
      {
        label: 'Select Current Reviews',
        description: `
          <div class="hlx-details">
            Switch review environments
          </div>`,
        actions: [
        ],
      },
      reviews.map((review) => createReview(review, review.reviewId, currentReview, env)),
    );
    pill.classList.add(currentReview ? `is-${currentReview.status}` : 'is-active');
    overlay.append(pill);  
  } else {
    const pageInReview = findPageInReviews(window.location.pathname);
    const pageStatus = pageInReview ? pageInReview.status : '';
    let pill;
    switch (pageStatus) {
      case 'open':
        pill = createPopupButton(
          'This page is Ready for Review',
          {
            label: `Enlisted in: ${pageInReview.reviewId}`,
            description: `
              <div class="hlx-details">
                ${pageInReview.description}
              </div>`,
            actions: [
              {
                label: 'View',
                // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
                href: `https://${pageInReview.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}`,
              },          
            ],
          },
          [createRemoveFromReview(pageInReview.reviewId, env)],
        );
        break;
      case 'submitted':
        pill = createPopupButton(
          'This page is locked and Submitted to Review',
          {
            label: `Enlisted in: ${pageInReview.reviewId}`,
            description: `
              <div class="hlx-details">
                ${pageInReview.description}
              </div>`,
            actions: [
              {
                label: 'View',
                // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
                href: `https://${pageInReview.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}`,
              },          
            ],
          },
        );
        break;
      default:
        pill = createPopupButton(
          'Editorial',
          {
            label: 'This page is not enlisted in any review',
            description: `
              <div class="hlx-details">
                To add this page to a review select from open reviews below or create a new review
              </div>`,
            actions: [
              {
                label: 'New',
                // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
                href: `https://${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}`,  
              }
            ],
          },
          reviews.filter((r) => r.status === 'open').map((review) => createAddToReview(review, env)),
        );
    }
  overlay.append(pill);  
  }
}

/**
 * Decorates Preview mode badges and overlays
 * @return {Object} returns a badge or empty string
 */
export default async function decoratereviewSwitcherOverlay() {
  try {
    const overlay = getOverlay();
    await decoratereviewSwitcherPill(overlay);
  } catch (e) {
    console.log(e);
  }
}
