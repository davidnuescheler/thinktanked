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
} from '../../scripts/aem.js';
import {
  createPopupButton,
  getOverlay,
} from './preview.js';

import {
  addPageToReview,
  removePageFromReview,
  updateReview,
  submitForReview,
  approveReview,
  rejectReview,
  openReview,
} from './review-actions.js';


function createAddToReview(pathname, review, env) {
  return {
    label: `Add this page to: ${review.reviewId}`,
    description: review.description,
    actions: [
      {
        label: 'Add',
        href: `#`,
        click: () => {
          addPageToReview(pathname, review.reviewId, env)
        }
      },
    ],
  };
}

function createRemoveFromReview(pathname, review, env) {
  return {
    label: `Remove this page from the review before submission`,
    actions: [
      {
        label: 'Remove',
        // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
        click: () => {
          removePageFromReview(pathname, review.reviewId, env)
        },
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
        buttons = '<br><p><a id="hlx-reject" href="#">Reject Review</a> <a id="hlx-approve" href="#">Publish</a><p>';
        break;
      default:
        buttons = '<br><p><a id="hlx-submit" href="#">Submit for Review</a></p>';
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

function openCreateReview(env) {
  const dialog = document.createElement('dialog'); 
  dialog.className = 'hlx-dialog';
  const overlay = getOverlay();
  dialog.innerHTML = `
    <form method="dialog">
      <button class="hlx-close-button">X</button>
    </form>
    <h3>Create new Review</h3>
    <p>Add a unique ID and description below</p>
    <input id="hlx-review-id" placeholder="Review ID">
    <textarea id="hlx-review-description" placeholder="Review Description" name="description" rows="3"></textarea>
    <button id="hlx-create-review">Create new Review</button>
  `;
  overlay.append(dialog);
  const button = dialog.querySelector('#hlx-create-review');
  if (button) button.addEventListener('click', () => {
    const reviewId = dialog.querySelector('#hlx-review-id').value;
    const description = dialog.querySelector('#hlx-review-description').value;
    openReview(reviewId, description, env);
    dialog.close()
  });
  dialog.showModal();
}


function openManifest(review, env) {
  const dialog = document.createElement('dialog'); 
  dialog.className = 'hlx-dialog';
  const overlay = getOverlay();
  const edit = review.status === 'open' ? `<textarea rows="10">${review.pages.map((path) => `https://${env.ref}--${env.repo}--${env.owner}.hlx.page${path}`).join('\n')}</textarea><button id="hlx-update-manifest">Update Manifest</button>` : '';

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
  const update = dialog.querySelector('#hlx-update-manifest');
  if (update) {
    update.addEventListener('click', () => {
      const ta = dialog.querySelector('textarea');
      const pages = ta.value.split('\n').map((url) => new URL(url, window.location.href).pathname);
      updateReview(pages, review.reviewId, env);
    });
  }
  overlay.append(dialog);
  dialog.showModal();
}

async function decorateReviewSwitcherPill(overlay) {
  let hostname = window.location.hostname;
  if (hostname === 'localhost') {
    hostname = 'default--main--thinktanked--davidnuescheler.hlx.reviews';
    // hostname = 'main--thinktanked--davidnuescheler.hlx.page'
  }
  const env = getReviewEnv(hostname);
  const adminHost = env.review ? `${env.review}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews` : `${env.ref}--${env.repo}--${env.owner}.hlx.reviews`;
  const resp = await fetch(`https://${adminHost}/admin/?ck=${Math.random()}`, {
    cache: 'no-store',
  });
  const json = await resp.json();
  const reviews = json.data;
  console.log(reviews);
  reviews.forEach((review) => {
    review.pages = review.pages ? review.pages.split(',').map((p) => p.trim()) : [];
  });
  console.log(env);

  let simpleReview = false;
  if (reviews.length === 1 && reviews[0].reviewId === 'default') simpleReview = true;
  
  const currentReview = env.review ? reviews.find((e) => env.review === e.reviewId) : undefined;
  const reviewMode = !!currentReview;

  const findPageInReviews = (pathname) => reviews.find((r) => r.pages.includes(pathname));
  
  let pill;
  if (reviewMode) {
    const reviewIdSuffix = currentReview.reviewId === 'default' ? '' : `: ${currentReview.reviewId}`; 
    const reviewDisplay = currentReview.status === 'submitted' ? `Submitted for Review ${reviewIdSuffix}` : `Preparing for Review ${reviewIdSuffix}`;
  
    if (simpleReview) {
      let buttons, label;
      if (currentReview.status === 'submitted') {
        label = 'Review Submitted';
        buttons = '<br><p><a id="hlx-reject" href="#">Reject Review</a> <a id="hlx-approve" href="#">Publish</a><p>';
      } else {
        label = 'Review in Preparation';
        buttons = '<br><p><a id="hlx-submit" href="#">Submit for Review</a></p>';
      }

      pill = createPopupButton(
        `${reviewDisplay}`,
        {
          label,
          description: `Check and manage Review`,
          actions: [ {
              label: 'Manage',
              // href: `${window.location.pathname}?content-branch=/drafts/${review.status}/${review.reviewId}`,
              href: `#`,
              click: () => {
                openManifest(currentReview, env);
              }    
            },
          ],
        },
        [
          {
            label: buttons,
          }      
        ],
        currentReview.status === 'open' ? 'unlocked' : 'locked',
      );  

    } else {
      pill = createPopupButton(
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
        currentReview.status === 'open' ? 'unlocked' : 'locked',
      );  
    }
    pill.classList.add(currentReview ? `is-${currentReview.status}` : 'is-editorial');
    const verbs = [{id: 'reject', f: rejectReview}, {id: 'approve', f: approveReview}, {id: 'submit', f: submitForReview}]
    
    verbs.forEach((verb) => {
      const button = pill.querySelector(`#hlx-${verb.id}`);
      if (button) button.addEventListener('click', () => {
        verb.f(currentReview.reviewId, env);
      });  
    });
  } else {
    const pageInReview = findPageInReviews(window.location.pathname);
    const pageStatus = pageInReview ? pageInReview.status : '';
    switch (pageStatus) {
      case 'open':
        pill = createPopupButton(
          'Ready for Review',
          {
            label: `Enlisted in: ${pageInReview.reviewId}`,
            description: `
              <div class="hlx-details">
                ${pageInReview.description}
              </div>`,
            actions: [
              {
                label: 'View',
                href: `https://${pageInReview.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}`,
              },          
            ],
          },
          [createRemoveFromReview(window.location.pathname, pageInReview, env)],
          'unlocked',
        );
        break;
      case 'submitted':
        pill = createPopupButton(
          'Submitted for Review',
          {
            label: `Enlisted in: ${pageInReview.reviewId}`,
            description: `
              <div class="hlx-details">
                ${pageInReview.description}
              </div>`,
            actions: [
            ],
          },
          [{
            label: 'Go to review',
            actions: [
              {
                label: 'View',
                href: `https://${pageInReview.reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}`,
              }
            ]
          }],
          'locked',
        );
        break;
      default:
        const actions = simpleReview ? [] : [
          {
            label: 'New',
            click: () => {
              openCreateReview(env);
            },
          }
        ];
        pill = createPopupButton(
          'Editorial',
          {
            label: 'This page is not enlisted for review',
            description: '',
            actions,
          },
          reviews.filter((r) => r.status === 'open').map((review) => createAddToReview(window.location.pathname, review, env)),
        );
    }
    pill.classList.add(pageInReview ? `is-${pageInReview.status}` : 'is-editorial');
  }
  overlay.append(pill);  
}

/**
 * Decorates Preview mode badges and overlays
 * @return {Object} returns a badge or empty string
 */
export default async function decorateReviewSwitcherOverlay() {
  try {
    const overlay = getOverlay();
    await decorateReviewSwitcherPill(overlay);
  } catch (e) {
    console.log(e);
  }
}
