import subprocess
import sys

# D1 数据库配置
DB_ID = "59a95578-9781-4592-a711-d961765766c5"

# 要更新的数据
updates = [
    {
        "field": "effects_json",
        "value": '[{"project":"52000钻-炽恋弦歌.aep","name":"高斯模糊"},{"project":"52000钻-炽恋弦歌.aep","name":"色彩校正"},{"project":"52000钻-炽恋弦歌.aep","name":"噪点"},{"project":"落樱动态房间背景.aep","name":"发光"}]'
    },
    {
        "field": "layers_json",
        "value": '[{"project":"52000钻-炽恋弦歌.aep","name":"背景层"},{"project":"52000钻-炽恋弦歌.aep","name":"文字层"},{"project":"52000钻-炽恋弦歌.aep","name":"视频层"},{"project":"落樱动态房间背景.aep","name":"装饰层"}]'
    },
    {
        "field": "keyframes_json",
        "value": '[{"project":"52000钻-炽恋弦歌.aep","layer":"位置","count":15},{"project":"52000钻-炽恋弦歌.aep","layer":"缩放","count":8},{"project":"52000钻-炽恋弦歌.aep","layer":"旋转","count":5},{"project":"落樱动态房间背景.aep","layer":"透明度","count":3}]'
    }
]

print("开始更新数据库...")

for update in updates:
    sql = f"UPDATE work_logs SET {update['field']} = '{update['value']}' WHERE id=348;"
    print(f"执行: {sql}")
    
    result = subprocess.run([
        'npx', 'wrangler', 'd1', 'execute', 'rualive',
        '--remote', '--command=' + sql
    ], capture_output=True, text=True)
    
    print(f"返回: {result.stdout}")
    if result.stderr:
        print(f"错误: {result.stderr}")
    print()

print("更新完成！")