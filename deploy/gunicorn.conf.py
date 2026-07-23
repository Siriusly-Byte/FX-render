import multiprocessing

# Server socket
bind = 'unix:/run/fx-assistant.sock'
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '/var/log/fx-assistant/access.log'
errorlog = '/var/log/fx-assistant/error.log'
loglevel = 'info'
access_log_format = '%({X-Real-IP}i)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = 'fx-assistant'

# Server mechanics
daemon = False
pidfile = '/tmp/fx-assistant.pid'
umask = 0
user = 'www-data'
group = 'www-data'
