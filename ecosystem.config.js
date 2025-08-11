module.exports = {
  apps: [
    {
      name: 'dtvisuals-prod',
      cwd: '/var/www/dtvisuals/app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      },
      env_file: '/var/www/dtvisuals/app/.env.prod',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: '/var/log/dtvisuals/prod-error.log',
      out_file: '/var/log/dtvisuals/prod-out.log',
      log_file: '/var/log/dtvisuals/prod-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'dtvisuals-dev',
      cwd: '/var/www/dtvisuals/app',
      script: 'npm',
      args: 'run dev:server',
      env: {
        NODE_ENV: 'development'
      },
      env_file: '/var/www/dtvisuals/app/.env.dev',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: '/var/log/dtvisuals/dev-error.log',
      out_file: '/var/log/dtvisuals/dev-out.log',
      log_file: '/var/log/dtvisuals/dev-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false
    }
  ]
};