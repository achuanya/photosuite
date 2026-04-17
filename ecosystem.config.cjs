module.exports = {
  apps: [
    {
      name: "photosuite",
      cwd: `${__dirname}/demo`,
      script: "pnpm",
      args: "run preview --port 44444 --host 0.0.0.0 --allowed-hosts photosuite.lhasa.icu",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 5000,
    },
  ],
};