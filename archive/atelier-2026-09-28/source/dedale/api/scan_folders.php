<?php
require_once __DIR__.'/_util.php';
require_admin();

$root = root_dir();
$exclude = ['api','assets','config','node_modules','.git','.well-known'];

$folders = [];
$dh = opendir($root);
if($dh){
  while(($entry = readdir($dh)) !== false){
    if($entry === '.' || $entry === '..') continue;
    if(in_array($entry, $exclude, true)) continue;
    $p = $root . DIRECTORY_SEPARATOR . $entry;
    if(is_dir($p)){
      // ignore hidden dirs (compat PHP < 8)
      if(substr($entry, 0, 1) === '.') continue;
      $folders[] = $entry;
    }
  }
  closedir($dh);
}
sort($folders);

$projectsPath = $root . '/steam_projects.json';
$doorsPath = $root . '/steam_doors.json';
$projects = file_exists($projectsPath) ? json_decode(file_get_contents($projectsPath), true) : [];
$doorsData = file_exists($doorsPath) ? json_decode(file_get_contents($doorsPath), true) : ['doors'=>[]];

$projFolders = [];
foreach(($projects ?: []) as $p){
  if(isset($p['folder'])) $projFolders[] = $p['folder'];
}
$doorFolders = [];
foreach(($doorsData['doors'] ?? []) as $d){
  if(isset($d['folder']) && $d['folder']) $doorFolders[] = $d['folder'];
}

json_response([
  'ok'=>true,
  'root'=>basename($root),
  'folders'=>$folders,
  'projects_folders'=>array_values(array_unique($projFolders)),
  'doors_folders'=>array_values(array_unique($doorFolders))
]);
