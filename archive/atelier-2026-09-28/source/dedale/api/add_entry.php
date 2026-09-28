<?php
require_once __DIR__.'/_util.php';
require_admin();
$root = root_dir();
$folder = trim($_POST['folder'] ?? '');
$kind = trim($_POST['kind'] ?? 'both');
if($folder === '') json_response(['ok'=>false,'error'=>'MISSING_FOLDER'], 400);
if(preg_match('/[^a-zA-Z0-9_\-]/', $folder)) json_response(['ok'=>false,'error'=>'INVALID_FOLDER'], 400);

$projPath = $root.'/steam_projects.json';
$doorsPath = $root.'/steam_doors.json';
$projects = file_exists($projPath) ? json_decode(file_get_contents($projPath), true) : [];
if(!is_array($projects)) $projects = [];
$doorsData = file_exists($doorsPath) ? json_decode(file_get_contents($doorsPath), true) : ['basePath'=>'.','exitUrl'=>'https://steamescape.fr/limoges/','doors'=>[]];
if(!is_array($doorsData)) $doorsData = ['basePath'=>'.','exitUrl'=>'https://steamescape.fr/limoges/','doors'=>[]];
if(!isset($doorsData['doors']) || !is_array($doorsData['doors'])) $doorsData['doors'] = [];

$added = [];

if($kind === 'project' || $kind === 'both'){
  $exists = false;
  foreach($projects as $p){ if(($p['folder'] ?? '') === $folder) { $exists = true; break; } }
  if(!$exists){
    $title = ucwords(str_replace(['-','_'], ' ', $folder));
    $projects[] = [
      'id' => $folder,
      'folder' => $folder,
      'title' => $title,
      'description' => 'À compléter…',
      'tags' => ['steam','atelier'],
      'icon' => '⚙',
      'status' => 'en dev',
      'order' => 1000,
      'directUrl' => './'.$folder.'/'
    ];
    $added[] = 'project';
  }
}

if($kind === 'door' || $kind === 'both'){
  $exists = false;
  foreach($doorsData['doors'] as $d){ if(($d['folder'] ?? '') === $folder) { $exists = true; break; } }
  if(!$exists){
    $name = ucwords(str_replace(['-','_'], ' ', $folder));
    $doorsData['doors'][] = [
      'id' => 'porte-'.$folder,
      'name' => $name,
      'type' => 'temporal',
      'folder' => $folder,
      'redirectUrl' => './'.$folder.'/',
      'requireCode' => false,
      'validCodes' => [],
      'placeholder' => '—',
      'riddleTitle' => $name.' — Accès',
      'riddleText' => "Cette porte mène vers le sous-dossier ‘{$folder}’.",
      'hasNote' => false,
      'noteText' => '',
      'notePosition' => (object)[],
      'dialLabel' => '',
      'signText' => $name
    ];
    $added[] = 'door';
  }
}

file_put_contents($projPath, json_encode($projects, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
file_put_contents($doorsPath, json_encode($doorsData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
json_response(['ok'=>true,'added'=>$added]);
