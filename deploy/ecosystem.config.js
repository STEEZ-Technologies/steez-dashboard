// PM2 process config for the dashboard's production Node server.
// Run from the repo root on the ECS host: `pm2 start deploy/ecosystem.config.js`
module.exports = {
  apps: [
    {
      name: "steez-dashboard",
      cwd: "/srv/steez-dashboard",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      max_memory_restart: "500M",
      autorestart: true,
      watch: false,
    },
  ],
};
