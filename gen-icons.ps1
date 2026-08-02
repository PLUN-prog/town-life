Add-Type -AssemblyName System.Drawing
$rows = @(
  "................",
  ".......RR...S...",
  "......RRRR..SS..",
  ".....RRRRRR.....",
  "....RRRRRRRR....",
  "...KRRRRRRRRR...",
  "...KWWWWWWWWW...",
  "...KWWFWWWFWW...",
  "...KWWFWWWFWW...",
  "...KWWWDDDWWW...",
  "...WWWWDDDWWW...",
  "...WWWWDDDWWW...",
  "LLLLLLLLLLLLLLLL",
  "LTLTLTLTLTLTLTLT",
  "LLLLLLLLLLLLLLLL",
  "LTLTLTLTLTLTLTLT"
)
$map = @{
  '.' = '#6FBE9E'; 'S' = '#F6C453'; 'R' = '#F0A868'; 'K' = '#C97B63';
  'W' = '#FFFDF8'; 'F' = '#BFE3D2'; 'D' = '#A85F4B'; 'L' = '#57A584'; 'T' = '#4E9E7E'
}
function New-Icon($size, $path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'None'
  $g.InterpolationMode = 'NearestNeighbor'
  $scale = $size / 16.0
  for ($y = 0; $y -lt 16; $y++) {
    $line = $rows[$y]
    for ($x = 0; $x -lt 16; $x++) {
      $ch = $line.Substring($x, 1)
      $c = [System.Drawing.ColorTranslator]::FromHtml($map[$ch])
      $brush = New-Object System.Drawing.SolidBrush($c)
      $g.FillRectangle($brush, [float]($x*$scale), [float]($y*$scale), [float]$scale, [float]$scale)
      $brush.Dispose()
    }
  }
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "generated: $path ($size x $size)"
}
New-Item -ItemType Directory -Force -Path icons | Out-Null
New-Icon 192 "icons\icon-192.png"
New-Icon 512 "icons\icon-512.png"
New-Icon 180 "icons\apple-touch-icon.png"
