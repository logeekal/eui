/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { css } from '@emotion/react';

import { UseEuiTheme } from '../../../../services';
import {
  logicalCSS,
  logicalTextAlignCSS,
  mathWithUnits,
} from '../../../../global_styling';

export const euiDataGridCellOutlineStyles = ({ euiTheme }: UseEuiTheme) => {
  const focusColor = euiTheme.colors.primary;
  const hoverColor = euiTheme.colors.darkShade;
  const outlineWidth = euiTheme.border.width.thick;
  const borderRadius = mathWithUnits(
    euiTheme.border.radius.medium,
    (x) => x / 2
  );

  // Note: We use a pseudo element for the 'outline' over any other CSS approaches
  // (outline, border, box-shadow) because it gives us the most control and reduces
  // overlap with other cells or inner elements
  return {
    borderRadius,
    focusColor,
    focusStyles: `
      /* Remove outline as we're handling it manually. Needed to override global styles */
      &:focus-visible {
        outline: none;
      }

      &::after {
        content: '';
        /* We want this to be visually on top of cell content but not interactive */
        z-index: 2;
        pointer-events: none;
        position: absolute;
        inset: 0;
        border: ${outlineWidth} solid ${focusColor};
        border-radius: ${borderRadius};
      }
    `,
    hoverColor,
    hoverStyles: `
      &::after {
        border-color: ${hoverColor};
      }
    `,
  };
};

export const euiDataGridCellOutlineSelectors = (parentSelector = '&') => {
  // Focus selectors
  const focus = ':focus'; // cell has been clicked or keyboard navigated to
  const isOpen = '.euiDataGridRowCell--open'; // always show when the cell expansion popover is open
  const isClosing = '[data-keyboard-closing]'; // prevents the animation from replaying when keyboard focus is moved from the popover back to the cell
  const isEntered = ':has([data-focus-lock-disabled="false"])'; // cell focus trap has been entered - ideally show the outline still, but grayed out

  // Hover selectors
  const hover = ':hover'; // hover styles should not supercede focus styles
  const focusWithin = ':focus-within'; // used by :hover:not() to prevent flash of gray when mouse users are opening/closing the expansion popover via cell action click

  // Cell header specific selectors
  const headerActionsOpen = '.euiDataGridHeaderCell--isActionsPopoverOpen';

  // Utils
  const selectors = (...args: string[]) => [...args].join(', ');
  const is = (selectors: string) => `${parentSelector}:is(${selectors})`;
  const not = (selectors: string) => `${parentSelector}:not(${selectors})`;
  const hoverNot = (selectors: string) =>
    `${parentSelector}:hover:not(${selectors})`;
  const _ = (selectors: string) => `${parentSelector}${selectors}`;

  return {
    outline: {
      show: is(selectors(hover, focus, isOpen, isEntered)),
      hover: hoverNot(selectors(focus, focusWithin, isOpen)),
      focusTrapped: _(isEntered),
    },

    actions: {
      hoverZone: hoverNot(selectors(focus, isOpen)),
      hoverColor: hoverNot(selectors(focus, focusWithin, isOpen)),
      showAnimation: is(selectors(hover, focus, isOpen, isClosing)),
      hoverAnimation: hoverNot(selectors(focus, isOpen, isClosing)),
    },

    header: {
      focus: is(selectors(focus, focusWithin, headerActionsOpen)), // :focus-within here is primarily intended for when the column actions button has been clicked twice
      focusTrapped: _(isEntered),
      hideActions: not(selectors(hover, focusWithin, headerActionsOpen)),
    },
  };
};

export const euiDataGridRowCellStyles = (euiThemeContext: UseEuiTheme) => {
  const cellOutline = euiDataGridCellOutlineStyles(euiThemeContext);
  const { outline: outlineSelectors } = euiDataGridCellOutlineSelectors();

  return {
    euiDataGridRowCell: css`
      position: relative; /* Needed for .euiDataGridRowCell__actions */

      ${outlineSelectors.show} {
        ${cellOutline.focusStyles}
      }

      ${outlineSelectors.hover} {
        ${cellOutline.hoverStyles}
      }

      ${outlineSelectors.focusTrapped} {
        ${cellOutline.hoverStyles}
      }

      /* Hack to allow focus trap to still stretch to full row height on defined heights */
      & > [data-focus-lock-disabled] {
        ${logicalCSS('height', '100%')}
      }

      &:where(.euiDataGridRowCell--numeric, .euiDataGridRowCell--currency) {
        ${logicalTextAlignCSS('right')}
      }

      &:where(.euiDataGridRowCell--uppercase) {
        text-transform: uppercase;
      }

      &:where(.euiDataGridRowCell--lowercase) {
        text-transform: lowercase;
      }

      &:where(.euiDataGridRowCell--capitalize) {
        text-transform: capitalize;
      }
    `,

    content: {
      euiDataGridRowCell__content: css`
        overflow: hidden;
      `,
      controlColumn: css`
        ${logicalCSS('max-height', '100%')}
        display: flex;
        align-items: center;
      `,
      autoHeight: css`
        ${logicalCSS('height', 'auto')}
      `,
      defaultHeight: css`
        ${logicalCSS('height', '100%')}
      `,
    },
  };
};
