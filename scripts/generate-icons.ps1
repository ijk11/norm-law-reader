$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$appRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path

foreach ($size in @(192, 512)) {
    $bitmap = [Drawing.Bitmap]::new($size, $size)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([Drawing.ColorTranslator]::FromHtml('#111d3b'))

    $scale = $size / 64.0
    $paperBrush = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#f4f0e6'))
    $accentPen = [Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml('#d14a3a'), 3 * $scale)
    $accentPen.StartCap = [Drawing.Drawing2D.LineCap]::Round
    $accentPen.EndCap = [Drawing.Drawing2D.LineCap]::Round

    $page = [Drawing.Drawing2D.GraphicsPath]::new()
    [Drawing.PointF[]]$points = @(
        [Drawing.PointF]::new(15 * $scale, 14 * $scale),
        [Drawing.PointF]::new(38 * $scale, 14 * $scale),
        [Drawing.PointF]::new(49 * $scale, 25 * $scale),
        [Drawing.PointF]::new(49 * $scale, 50 * $scale),
        [Drawing.PointF]::new(26 * $scale, 50 * $scale),
        [Drawing.PointF]::new(15 * $scale, 39 * $scale)
    )
    $page.AddPolygon($points)
    $graphics.FillPath($paperBrush, $page)
    $graphics.DrawLine($accentPen, 25 * $scale, 15 * $scale, 25 * $scale, 50 * $scale)
    $graphics.DrawLine($accentPen, 31 * $scale, 26 * $scale, 43 * $scale, 26 * $scale)
    $graphics.DrawLine($accentPen, 31 * $scale, 33 * $scale, 43 * $scale, 33 * $scale)
    $graphics.DrawLine($accentPen, 31 * $scale, 40 * $scale, 40 * $scale, 40 * $scale)

    $output = Join-Path $appRoot "dist\icon-$size.png"
    $bitmap.Save($output, [Drawing.Imaging.ImageFormat]::Png)

    $page.Dispose()
    $accentPen.Dispose()
    $paperBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}

Write-Output 'Generated PWA icons.'
