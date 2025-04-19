#!/bin/bash

echo "Docker Resource Monitoring - $(date)"
echo "=================================="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.PIDs}}"
echo ""
echo "System Resources:"
free -h
echo ""
echo "Top Processes:"
ps aux | sort -rk 3,3 | head -n 5
