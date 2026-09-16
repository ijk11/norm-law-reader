param(
    [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\..'),
    [string]$EnglishSourceDirectory = (Join-Path $PSScriptRoot '..\..\..\md\영미')
)

$ErrorActionPreference = 'Stop'
$appRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$outputPath = Join-Path $appRoot 'dist\content.js'

$sources = @(
    [pscustomobject]@{
        Path = (Resolve-Path -LiteralPath $SourceDirectory).Path
        Collection = '일본'
    },
    [pscustomobject]@{
        Path = (Resolve-Path -LiteralPath $EnglishSourceDirectory).Path
        Collection = '영미'
    }
)

$documents = $sources | ForEach-Object {
    $source = $_
    Get-ChildItem -LiteralPath $source.Path -File -Filter '*.md' |
        Where-Object { $_.Name -ne '_작업메모.md' } |
        ForEach-Object {
        $content = [IO.File]::ReadAllText($_.FullName, [Text.UTF8Encoding]::new($false))
        $titleMatch = [regex]::Match($content, '(?m)^#\s+(.+)$')
        $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $_.BaseName }
        $yearMatch = [regex]::Match($content.Substring(0, [Math]::Min($content.Length, 5000)), '(?:19|20)\d{2}')
        $year = if ($yearMatch.Success) { [int]$yearMatch.Value } else { $null }

        $group = if ($source.Collection -eq '영미') {
            '영미 논문'
        } elseif ($_.Name.StartsWith('이이다 다카시')) {
            '이이다 연구'
        } elseif ($_.Name.StartsWith('후지타 도모타카')) {
            '후지타 연구선'
        } elseif ($_.Name -match '서평') {
            '서평'
        } else {
            '일본 논문'
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
            collection = $source.Collection
            title = $title
            author = $author
            group = $group
            kind = $kind
            year = $year
            content = $content
            words = ([regex]::Matches($content, '[가-힣A-Za-z0-9一-龠ぁ-んァ-ヶ]+')).Count
        }
    }
} | Sort-Object group, file

$json = ConvertTo-Json -InputObject @($documents) -Depth 5 -Compress
$payload = "window.MD_DOCUMENTS = $json;`n"
[IO.File]::WriteAllText($outputPath, $payload, [Text.UTF8Encoding]::new($false))
Write-Output "Synced $($documents.Count) Markdown documents to $outputPath"
