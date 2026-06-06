[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
$image = [System.Drawing.Image]::FromFile("D:\extensions\GitPilot\pr-dashboard\icons\icon128.png")
$image.Save("D:\extensions\GitPilot\pr-dashboard\icons\icon128_tmp.png", [System.Drawing.Imaging.ImageFormat]::Png)
$image.Dispose()
Remove-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon128.png" -Force
Rename-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon128_tmp.png" "icon128.png" -Force
Copy-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon128.png" "D:\extensions\GitPilot\pr-dashboard\icons\icon48.png" -Force
Copy-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon128.png" "D:\extensions\GitPilot\pr-dashboard\icons\icon16.png" -Force