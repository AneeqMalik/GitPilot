$Url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBBCDTldq29EgBamhQycF8oSkiAfC4sVE6Yg&s"
Invoke-WebRequest -Uri $Url -OutFile "D:\extensions\GitPilot\pr-dashboard\icons\raw_logo.jpg"

[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
$img = [System.Drawing.Bitmap]::FromFile("D:\extensions\GitPilot\pr-dashboard\icons\raw_logo.jpg")

$outImg = New-Object System.Drawing.Bitmap(128, 128)
$g = [System.Drawing.Graphics]::FromImage($outImg)
$g.DrawImage($img, 0, 0, 128, 128)
$g.Dispose()

$tolerance = 60
for ($x = 0; $x -lt 128; $x++) {
    for ($y = 0; $y -lt 128; $y++) {
        $pixel = $outImg.GetPixel($x, $y)
        # Check if the pixel is close to white (255, 255, 255)
        if ($pixel.R -gt (255 - $tolerance) -and $pixel.G -gt (255 - $tolerance) -and $pixel.B -gt (255 - $tolerance)) {
            $outImg.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}

$outImg.Save("D:\extensions\GitPilot\pr-dashboard\icons\icon128.png", [System.Drawing.Imaging.ImageFormat]::Png)

$outImg48 = New-Object System.Drawing.Bitmap(48, 48)
$g48 = [System.Drawing.Graphics]::FromImage($outImg48)
$g48.DrawImage($outImg, 0, 0, 48, 48)
$g48.Dispose()
$outImg48.Save("D:\extensions\GitPilot\pr-dashboard\icons\icon48.png", [System.Drawing.Imaging.ImageFormat]::Png)

$outImg16 = New-Object System.Drawing.Bitmap(16, 16)
$g16 = [System.Drawing.Graphics]::FromImage($outImg16)
$g16.DrawImage($outImg, 0, 0, 16, 16)
$g16.Dispose()
$outImg16.Save("D:\extensions\GitPilot\pr-dashboard\icons\icon16.png", [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$outImg.Dispose()
$outImg48.Dispose()
$outImg16.Dispose()
Remove-Item "D:\extensions\GitPilot\pr-dashboard\icons\raw_logo.jpg" -Force