module.exports = {
  apps: [{
    name: 'makrosms',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/makrosms',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/makrosms/error.log',
    out_file: '/var/log/makrosms/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};

