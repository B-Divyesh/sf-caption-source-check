import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  // The service worker intentionally holds no state. It gives browser tooling a
  // stable extension target while caption data remains in the inspected tab.
});
