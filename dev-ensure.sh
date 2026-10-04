#!/bin/bash
# Ensures the Next.js dev server on :3000 is up (sandbox may reap it between calls)
if ! curl -s -o /dev/null --max-time 2 http://localhost:3000/; then
  cd /home/z/my-project
  nohup bun run dev >> dev.log 2>&1 &
  for i in $(seq 1 60); do
    curl -s -o /dev/null --max-time 2 http://localhost:3000/ && break
    sleep 1
  done
fi
curl -s -o /dev/null -w "dev-server:%{http_code}\n" --max-time 5 http://localhost:3000/
