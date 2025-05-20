// Allow TypeScript to recognize process.env
declare var process: {
  env: {
    [key: string]: string | undefined;
  }
}; 