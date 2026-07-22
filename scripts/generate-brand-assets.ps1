Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot "..\public"
$width = 2048
$height = 1152
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#dfe7df"))

function Brush($color) { New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color)) }
function Pen($color, $size) { New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($color), $size) }

$sky = Brush "#dfe7df"
$far = Brush "#b9c8bd"
$building = Brush "#f4f2ea"
$shadow = Brush "#c9cec7"
$green = Brush "#305f50"
$dark = Brush "#18352e"
$red = Brush "#b85a4c"
$path = Brush "#d9d4c7"
$window = Brush "#789188"
$white = Brush "#f8f8f3"

$graphics.FillRectangle($sky, 0, 0, $width, $height)
$graphics.FillEllipse($far, -180, 520, 900, 480)
$graphics.FillEllipse($far, 1380, 500, 880, 500)
$graphics.FillRectangle($path, 0, 820, $width, 332)

$graphics.FillRectangle($shadow, 300, 395, 1460, 470)
$graphics.FillRectangle($building, 280, 365, 1460, 470)
$graphics.FillRectangle($building, 690, 255, 640, 580)
$graphics.FillRectangle($dark, 655, 235, 710, 35)

for ($row = 0; $row -lt 4; $row++) {
  for ($col = 0; $col -lt 9; $col++) {
    $x = 350 + ($col * 150)
    $y = 430 + ($row * 88)
    $graphics.FillRectangle($window, $x, $y, 72, 42)
  }
}

$graphics.FillRectangle($dark, 918, 620, 205, 215)
$graphics.FillRectangle($red, 280, 350, 1460, 15)

foreach ($treeX in @(130, 240, 1780, 1905)) {
  $graphics.FillRectangle($dark, $treeX + 34, 650, 18, 205)
  $graphics.FillEllipse($green, $treeX, 535, 90, 165)
  $graphics.FillEllipse($dark, $treeX + 24, 570, 82, 135)
}

$routePen = Pen "#b85a4c" 8
$routePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$points = @(
  (New-Object System.Drawing.Point(180, 880)),
  (New-Object System.Drawing.Point(610, 730)),
  (New-Object System.Drawing.Point(1030, 790)),
  (New-Object System.Drawing.Point(1470, 700)),
  (New-Object System.Drawing.Point(1890, 850))
)
$graphics.DrawCurve($routePen, $points)
foreach ($point in $points) { $graphics.FillEllipse($red, $point.X - 13, $point.Y - 13, 26, 26) }

function DrawPerson($x, $y, $scale, $bodyColor) {
  $body = Brush $bodyColor
  $skin = Brush "#d2ae92"
  $graphics.FillEllipse($skin, $x, $y, 34 * $scale, 34 * $scale)
  $graphics.FillRectangle($body, $x - (8 * $scale), $y + (35 * $scale), 50 * $scale, 90 * $scale)
  $legPen = Pen "#27332f" (12 * $scale)
  $graphics.DrawLine($legPen, $x + (4 * $scale), $y + (120 * $scale), $x - (2 * $scale), $y + (190 * $scale))
  $graphics.DrawLine($legPen, $x + (30 * $scale), $y + (120 * $scale), $x + (43 * $scale), $y + (190 * $scale))
  $legPen.Dispose()
  $skin.Dispose()
  $body.Dispose()
}

DrawPerson 620 760 1.15 "#305f50"
DrawPerson 1190 745 1.05 "#b85a4c"
DrawPerson 1510 800 0.9 "#465a53"

$overlay = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 18, 63, 53))
$graphics.FillRectangle($overlay, 0, 0, $width, $height)

$output = Join-Path $publicDir "hero-campus.png"
$stream = [System.IO.File]::Open($output, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
try {
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $stream.Dispose()
}

foreach ($item in @($sky,$far,$building,$shadow,$green,$dark,$red,$path,$window,$white,$overlay,$routePen)) { $item.Dispose() }
$graphics.Dispose()
$bitmap.Dispose()

if (-not (Test-Path -LiteralPath $output)) { throw "Hero image was not generated" }
Write-Output "Generated $output"
