import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  modules: [],
  manifest: {
    name: 'Caption Source Check',
    description: 'Check a page for official exposed caption tracks and read them in a calm, large-text view.',
    version: '1.0.0',
    minimum_chrome_version: '114',
    permissions: ['activeTab', 'scripting'],
    action: {
      default_title: 'Check caption source'
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+U',
          mac: 'MacCtrl+Shift+U'
        },
        description: 'Check the current page for exposed captions'
      }
    },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  }
});
