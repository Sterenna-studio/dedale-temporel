<?php
require_once __DIR__.'/_util.php';
require_admin();
$root = root_dir();
$path = $root . '/steam_projects.json';

$raw = file_get_contents('php://input');
if(!$raw) $raw = $_POST['json'] ?? '';
$decoded = json_decode($raw, true);
if($decoded === null && json_last_error() !== JSON_ERROR_NONE){
  json_response(['ok'=>false,'error'=>'INVALID_JSON','details'=>json_last_error_msg()], 400);
}
if(!is_array($decoded)){
  json_response(['ok'=>false,'error'=>'JSON_MUST_BE_ARRAY'], 400);
}
file_put_contents($path, json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
json_response(['ok'=>true,'written'=>basename($path)]);
