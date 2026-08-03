# Shared helpers for scripts/*.sh (sourced with: . "$(dirname "$0")/lib-ports.sh")
# Do not use `| while read` to kill PIDs — on macOS Bash 3.2 the loop runs in a subshell and
# port 3000 may never be freed → EADDRINUSE when starting Next.

# Free TCP listen port $1 (retry kill until nothing is listening).
free_tcp_port() {
  local port="$1"
  local attempt pids pid
  for attempt in 1 2 3 4 5 6 7 8; do
    pids=$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null | sort -u)
    if [[ -z "${pids}" ]]; then
      return 0
    fi
    for pid in ${pids}; do
      case "${pid}" in (*[!0-9]*) continue ;; esac
      echo "   :${port} → kill -9 ${pid}"
      kill -9 "${pid}" 2>/dev/null || true
    done
    sleep 0.4
  done
  if lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✗ Port ${port} still in use. Run: lsof -nP -iTCP:${port} -sTCP:LISTEN"
    return 1
  fi
  return 0
}
