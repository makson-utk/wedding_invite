function Get-DataUri([string]$path) {
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $base64 = [System.Convert]::ToBase64String($bytes)
  return "data:image/jpeg;base64,$base64"
}
$bg1 = Get-DataUri "images/bg1.jpg"
$bg2 = Get-DataUri "images/bg2.jpg"
$bg3 = Get-DataUri "images/bg3.jpg"
$bg1 | Set-Content -Path images/bg1.uri.txt
$bg2 | Set-Content -Path images/bg2.uri.txt
$bg3 | Set-Content -Path images/bg3.uri.txt
