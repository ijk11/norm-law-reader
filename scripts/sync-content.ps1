param(
    [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\..')
)

$ErrorActionPreference = 'Stop'
$sourceRoot = (Resolve-Path -LiteralPath $SourceDirectory).Path
$appRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$outputPath = Join-Path $appRoot 'dist\content.js'

$documents = Get-ChildItem -LiteralPath $sourceRoot -File -Filter '*.md' |
    Where-Object { $_.Name -ne '_작업메모.md' } |
    Sort-Object Name |
    ForEach-Object {
        $content = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8
        $titleMatch = [regex]::Match($content, '(?m)^#\s+(.+)$')
        $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $_.BaseName }
        $yearMatch = [regex]::Match($content.Substring(0, [Math]::Min($content.Length, 5000)), '(?:19|20)\d{2}')
        $year = if ($yearMatch.Success) { [int]$yearMatch.Value } else { $null }

        $group = if ($_.Name.StartsWith('이이다 다카시')) {
            '이이다 연구'
        } elseif ($_.Name.StartsWith('후지타 도모타카')) {
            '후지타 연구선'
        } else {
            '서평'
        }

        $author = if ($_.Name.StartsWith('이이다 다카시')) {
            '이이다 다카시'
        } elseif ($_.Name.StartsWith('후지타 도모타카')) {
            '후지타 도모타카'
        } elseif ($_.Name.StartsWith('마쓰무라 요시유키')) {
            '마쓰무라 요시유키'
        } elseif ($_.Name.StartsWith('세토야마 고이치')) {
            '세토야마 고이치'
        } else {
            ($_.BaseName -split ',')[0]
        }

        $kind = if ($_.Name -match '연구과제') {
            '연구과제 기록'
        } elseif ($_.Name -match '서평') {
            '서평'
        } else {
            '논문 해설'
        }

        [ordered]@{
            id = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_.Name)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
            file = $_.Name
            title = $title
            author = $author
            group = $group
            kind = $kind
            year = $year
            content = $content
            words = ([regex]::Matches($content, '[가-힣A-Za-z0-9一-龠ぁ-んァ-ヶ]+')).Count
        }
    }

$json = ConvertTo-Json -InputObject @($documents) -Depth 5 -Compress
$payload = "window.MD_DOCUMENTS = $json;`n"
[IO.File]::WriteAllText($outputPath, $payload, [Text.UTF8Encoding]::new($false))
Write-Output "Synced $($documents.Count) Markdown documents to $outputPath"
