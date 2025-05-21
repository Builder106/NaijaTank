import { defineConfig } from 'vite';

export default defineConfig({
  // Add your Vite specific configurations here.
  // For example, to add plugins:
  // plugins: [],

  // To define server options:
  // server: {
  //   port: 3000,
  //   proxy: {
  //     // Example proxy configuration
  //     // '/api': 'http://localhost:8080'
  //   }
  // },

  // To define build options:
  // build: {
  //   // Example build options
  //   // outDir: 'dist',
  // }

  // Vite automatically loads .env files.
  // VITE_ prefixed variables are exposed to client code via import.meta.env.
  // If you need to expose other non-prefixed variables from your .env file
  // or define global constants, you can use the define option:
  // define: {
  //   '__APP_VERSION__': JSON.stringify('1.0.0'),
  //   // 'process.env.CUSTOM_VAR': JSON.stringify(process.env.CUSTOM_VAR),
  // }
}); 