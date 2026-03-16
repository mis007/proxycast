#!/bin/bash
# 性能监控脚本

echo "📊 统一记忆系统 - 性能监控"
echo ""

# 数据库大小
DB_SIZE=$(du -h ~/.lime/lime.db 2>/dev/null | cut -f1)
echo "数据库大小: ${DB_SIZE:-未知}"

# 记忆数量
MEMORY_COUNT=$(sqlite3 ~/.lime/lime.db "SELECT COUNT(*) FROM unified_memory WHERE archived = 0;" 2>/dev/null)
echo "记忆数量: ${MEMORY_COUNT:-0}"

# 反馈数量
FEEDBACK_COUNT=$(sqlite3 ~/.lime/lime.db "SELECT COUNT(*) FROM memory_feedback;" 2>/dev/null)
echo "反馈数量: ${FEEDBACK_COUNT:-0}"

# 批准率
if [ "$FEEDBACK_COUNT" -gt 0 ]; then
    APPROVE_COUNT=$(sqlite3 ~/.lime/lime.db "SELECT COUNT(*) FROM memory_feedback WHERE action LIKE '%approve%';" 2>/dev/null)
    RATE=$(echo "scale=1; $APPROVE_COUNT * 100 / $FEEDBACK_COUNT" | bc 2>/dev/null)
    echo "批准率: ${RATE:-0}%"
fi

echo ""
echo "✅ 监控完成"
