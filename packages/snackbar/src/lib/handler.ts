import {createLogger} from '@alwatr/logger';
import {parseDuration} from '@alwatr/parse-duration';
import {waitForTimeout} from '@alwatr/wait';

import {snackbarActionButtonClickedSignal, snackbarSignal} from './signal.js';

import type {SnackbarOptions} from './type.js';

const logger = createLogger(`${__package_name__}/handler`);

/**
 * Store the function to close the last snackbar.
 */
let closeLastSnackbar: (() => Promise<void>) | null = null;

/**
 * Store the function to unsubscribe the action button handler after close or action button clicked.
 */
let unsubscribeActionButtonHandler: (() => void) | null = null;

/**
 * Displays the snackbar with the given options.
 *
 * @param options - Options for configuring the snackbar.
 */
async function showSnackbar(options: SnackbarOptions): Promise<void> {
  logger.logMethodArgs?.('showSnackbar', {options});

  // Set default duration if not provided
  options.duration ??= '5s';

  const element = document.createElement('snack-bar');

  element.setAttribute('content', options.content);

  if (options.addCloseButton === true) {
    element.setAttribute('add-close-button', '');
  }

  if (options.action != null) {
    element.setAttribute('action-button-label', options.action.label);

    const actionButtonClickHandler = (event: {id: string}) => {
      if (event.id !== options.action!.id) return;
      logger.logOther?.('Snackbar action button clicked.', event);

      return closeSnackbar();
    };

    // Subscribe to the action button click
    unsubscribeActionButtonHandler = snackbarActionButtonClickedSignal.subscribe(actionButtonClickHandler.bind(null), {
      once: true,
    }).unsubscribe;
  }

  let closed = false;
  const closeSnackbar = async () => {
    if (closed === true) return;
    logger.logMethodArgs?.('closeSnackbar', {options});

    await element.close();
    unsubscribeActionButtonHandler?.();
    closed = true;
  };

  // Close the last snackbar if it exists
  await closeLastSnackbar?.();
  closeLastSnackbar = closeSnackbar;
  document.body.appendChild(element);

  // Set a timeout to close the snackbar if duration is not infinite
  if (options.duration !== 'infinite') {
    waitForTimeout(parseDuration(options.duration)).then(closeSnackbar);
  }
}

// Subscribe to the snackbar signal to show the snackbar when the signal is emitted.
snackbarSignal.subscribe((options) => {
  showSnackbar(options);
});
