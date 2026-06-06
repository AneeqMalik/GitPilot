[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
$img = [System.Drawing.Bitmap]::FromFile("D:\extensions\GitPilot\pr-dashboard\icons\icon128.png")

# Resize to 128x128
$resized = New-Object System.Drawing.Bitmap(128, 128)
$g = [System.Drawing.Graphics]::FromImage($resized)
$g.DrawImage($img, 0, 0, 128, 128)
$g.Dispose()

$outImg = New-Object System.Drawing.Bitmap(128, 128)

$bgColor = $resized.GetPixel(0, 0)
$tolerance = 60

for ($x = 0; $x -lt 128; $x++) {
    for ($y = 0; $y -lt 128; $y++) {
        $pixel = $resized.GetPixel($x, $y)
        $diffR = [Math]::Abs($pixel.R - $bgColor.R)
        $diffG = [Math]::Abs($pixel.G - $bgColor.G)
        $diffB = [Math]::Abs($pixel.B - $bgColor.B)
        
        if ($diffR -lt $tolerance -and $diffG -lt $tolerance -and $diffB -lt $tolerance) {
            $outImg.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
            $outImg.SetPixel($x, $y, $pixel)
        }
    }
}

$outImg.Save("D:\extensions\GitPilot\pr-dashboard\icons\icon128_transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 48x48
$resized48 = New-Object System.Drawing.Bitmap(48, 48)
$g48 = [System.Drawing.Graphics]::FromImage($resized48)
$g48.DrawImage($outImg, 0, 0, 48, 48)
$g48.Dispose()
$resized48.Save("D:\extensions\GitPilot\pr-dashboard\icons\icon48_transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 16x16
$resized16 = New-Object System.Drawing.Bitmap(16, 16)
$g16 = [System.Drawing.Graphics]::FromImage($resized16)
$g16.DrawImage($outImg, 0, 0, 16, 16)
$g16.Dispose()
$resized16.Save("D:\extensions\GitPilot\pr-dashboard\icons\icon16_transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$resized.Dispose()
$outImg.Dispose()
$resized48.Dispose()
$resized16.Dispose()

Remove-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon128.png" -Force
Remove-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon48.png" -Force
Remove-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon16.png" -Force

Rename-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon128_transparent.png" "icon128.png" -Force
Rename-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon48_transparent.png" "icon48.png" -Force
Rename-Item "D:\extensions\GitPilot\pr-dashboard\icons\icon16_transparent.png" "icon16.png" -Force