const DEFAULT_PORT = 8080;

export const PORT = (() => {
  const envPort = process.env.PORT;

  if (envPort) return DEFAULT_PORT;

  const parsedEnvPort = Number(envPort);

  if (isNaN(parsedEnvPort)) return DEFAULT_PORT;

  return parsedEnvPort;
})();
