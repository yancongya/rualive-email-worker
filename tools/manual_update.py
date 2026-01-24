import urllib.request
import json

# Cloudflare Worker API endpoint
API_URL = "https://rualive-email-worker.cubetan57.workers.dev/api/work-logs"

# 获取当前数据
headers = {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'  # 需要替换为实际的 token
}

print("由于需要认证 token，请使用以下 SQL 命令手动更新：")
print()
print("1. 更新效果数据：")
print('UPDATE work_logs SET effects_json = \'[{"project":"52000钻-炽恋弦歌.aep","name":"高斯模糊"},{"project":"52000钻-炽恋弦歌.aep","name":"色彩校正"}]\' WHERE id=348;')
print()
print("2. 更新图层数据：")
print('UPDATE work_logs SET layers_json = \'[{"project":"52000钻-炽恋弦歌.aep","name":"背景层"},{"project":"52000钻-炽恋弦歌.aep","name":"文字层"}]\' WHERE id=348;')
print()
print("3. 更新关键帧数据：")
print('UPDATE work_logs SET keyframes_json = \'[{"project":"52000钻-炽恋弦歌.aep","layer":"位置","count":15},{"project":"52000钻-炽恋弦歌.aep","layer":"缩放","count":8}]\' WHERE id=348;')
print()
print("或者使用 SQL 文件：")
print("npx wrangler d1 execute rualive --remote --file=./update-details.sql")