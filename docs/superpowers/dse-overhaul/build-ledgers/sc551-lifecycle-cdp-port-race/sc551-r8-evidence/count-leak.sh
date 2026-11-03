#!/bin/bash
# prints pid ppid etimes of leaked cdpOwned test servers (node -e http server writing DevToolsActivePort) and their bash wrappers
ps -eo pid,ppid,etimes,args | command grep -a "const http=require('http'),fs=require('fs')" | command grep -av grep | cut -c1-60
ps -eo pid,ppid,etimes,args | command grep -a 'DevToolsActivePort\|"\$0" -e "\$1"' | command grep -av 'grep\|count-leak' | cut -c1-100
