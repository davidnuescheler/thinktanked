import { countryInfo } from '../../geo.js';

export default function decorate(block) {
  block.textContent = `Your country is detected as: ${countryInfo()}`;
}
