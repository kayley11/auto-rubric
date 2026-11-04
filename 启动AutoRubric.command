#!/bin/bash
ROOT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR" || exit 1
RESULT=1
if [ ! -x "$ROOT_DIR/.venv/bin/python" ]; then
  printf '\n找不到现有 Python 环境，请先恢复项目环境。账号和结果没有被改动。\n'
else
  "$ROOT_DIR/.venv/bin/python" "$ROOT_DIR/arena/hosting/recover.py" "$@"
  RESULT=$?
fi
if [ "$RESULT" -eq 0 ] && [ "$#" -eq 0 ] && [ -t 0 ]; then
  open "https://auto-rubric.kayley1026lzt.chatgpt.site/#evaluate"
fi
if [ -t 0 ]; then
  printf '\n按回车关闭窗口；不影响已经启动的后台服务。\n'
  read -r _
fi
exit "$RESULT"
