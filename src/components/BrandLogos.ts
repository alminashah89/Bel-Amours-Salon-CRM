/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const origin = typeof window !== 'undefined' ? window.location.origin : '';

export const PRIMARY_LOGO_SVG = `
<style>
  .belamour-logo {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
    cursor: pointer;
    display: block;
    margin: 0 auto;
    object-fit: contain;
  }
  .belamour-logo:hover {
    transform: scale(1.12) rotate(2deg);
    filter: drop-shadow(0 8px 16px rgba(180, 138, 48, 0.35));
  }
</style>
<img src="${origin}/publich-logo-1.png.png" width="70" height="70" class="belamour-logo" alt="Bel'Amour Logo" />
`;

export const SECONDARY_LOGO_SVG = `
<style>
  .rj-logo {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
    cursor: pointer;
    display: block;
    margin: 0 auto;
    object-fit: contain;
  }
  .rj-logo:hover {
    transform: scale(1.12) rotate(-2deg);
    filter: drop-shadow(0 8px 16px rgba(197, 160, 89, 0.35));
  }
</style>
<img src="${origin}/public-logo-2.png.png" width="55" height="55" class="rj-logo" alt="RJ Group Logo" />
`;
