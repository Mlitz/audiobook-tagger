const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', 
  {
    // Send an IPC message to the main process
    send: (channel, data) => {
      // Whitelist channels for security
      const validChannels = [
        'metadata:lookup',
        'metadata:search',
        'metadata:process',
        'config:get',
        'config:set',
        'log:message',
        'app:status'
      ];
      
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },

    // Listen for messages from main process
    receive: (channel, callback) => {
      // Whitelist channels for security
      const validChannels = [
        'metadata:result',
        'metadata:error',
        'metadata:progress',
        'config:updated',
        'app:initialized',
        'app:error'
      ];
      
      if (validChannels.includes(channel)) {
        // Deliberately strip event data as it contains sensitive info
        const subscription = (event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        
        // Return a function to remove the event listener
        return () => ipcRenderer.removeListener(channel, subscription);
      }
      
      return null;
    },

    // Invoke a method in the main process and get a response
    invoke: async (channel, data) => {
      // Whitelist channels for security
      const validChannels = [
        'metadata:lookup-async',
        'metadata:search-async',
        'config:get-async',
        'app:status-async'
      ];
      
      if (validChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, data);
      }
      
      return null;
    }
  }
);

// Expose app info to renderer
contextBridge.exposeInMainWorld(
  'appInfo',
  {
    version: process.env.APP_VERSION || '0.1.0',
    platform: process.platform
  }
);

// Notify main process that preload script has completed
ipcRenderer.send('preload:ready');