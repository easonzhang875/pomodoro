# 叮！任务完成提示音
# 800Hz 高音 + 1000Hz 上升音 模拟「叮」的效果
[System.Console]::Beep(800, 180)
Start-Sleep -Milliseconds 60
[System.Console]::Beep(1000, 220)
