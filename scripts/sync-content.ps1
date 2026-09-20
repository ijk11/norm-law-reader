param(
    [string]$SourceRoot = (Join-Path $PSScriptRoot '..\..\..'),
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$appRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$outputPath = if ($OutputPath) { $OutputPath } else { Join-Path $appRoot 'dist\content.js' }
$sourceRootPath = (Resolve-Path -LiteralPath $SourceRoot).Path.TrimEnd('\')

# 해설은 md 폴더 아래 분야별 폴더에 흩어져 있다. 원래 영미/일본 폴더에 있던 문서의 구분은
# collections.json에 남겨 두고, 목록에 없는 새 문서는 첫머리에 가나가 있으면 일본으로 본다.
$collectionMap = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'collections.json'), [Text.UTF8Encoding]::new($false)) | ConvertFrom-Json

$documents = Get-ChildItem -LiteralPath $sourceRootPath -Recurse -File -Filter '*.md' |
    Where-Object {
        $top = $_.FullName.Substring($sourceRootPath.Length + 1).Split('\')[0]
        -not $top.StartsWith('_') -and $top -ne '목차가이드'
    } |
    ForEach-Object {
        $content = [IO.File]::ReadAllText($_.FullName, [Text.UTF8Encoding]::new($false))
        # 분야별 폴더 사이의 상대 링크를 앱이 읽는 파일 이름 링크로 되돌린다.
        $content = [regex]::Replace($content, '\]\(<(?:\.\.?/)+(?:[^<>/]+/)*([^<>/]+\.md)>\)', '](<./$1>)')
        $content = [regex]::Replace($content, '\]\((?:\.\.?/)+(?:[^)/]+/)*([^)/]+\.md)\)', '](./$1)')
        $mapped = $collectionMap.PSObject.Properties[$_.Name]
        $collection = if ($mapped) {
            $mapped.Value
        } elseif ($content.Substring(0, [Math]::Min($content.Length, 3000)) -match '[぀-ヿ]') {
            '일본'
        } else {
            '영미'
        }
        $titleMatch = [regex]::Match($content, '(?m)^#\s+(.+)$')
        $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $_.BaseName }
        # 파일명 끝에 붙인 발행연도를 우선한다. 제목 속 기간(예: 1884-1914)을
        # 발행연도로 오인하지 않도록 파일명에서는 마지막 연도를 사용한다.
        $fileYearMatches = [regex]::Matches($_.BaseName, '(?:19|20)\d{2}')
        $contentYearMatch = [regex]::Match($content.Substring(0, [Math]::Min($content.Length, 5000)), '(?:19|20)\d{2}')
        $year = if ($fileYearMatches.Count -gt 0) {
            [int]$fileYearMatches[$fileYearMatches.Count - 1].Value
        } elseif ($contentYearMatch.Success) {
            [int]$contentYearMatch.Value
        } else {
            $null
        }

        $group = if ($collection -eq '영미') {
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
            collection = $collection
            title = $title
            author = $author
            group = $group
            kind = $kind
            year = $year
            content = $content
            words = ([regex]::Matches($content, '[가-힣A-Za-z0-9一-龠ぁ-んァ-ヶ]+')).Count
        }
    } | Sort-Object group, file

$json = ConvertTo-Json -InputObject @($documents) -Depth 5 -Compress
$payload = "window.MD_DOCUMENTS = $json;`n"
[IO.File]::WriteAllText($outputPath, $payload, [Text.UTF8Encoding]::new($false))
Write-Output "Synced $($documents.Count) Markdown documents to $outputPath"
