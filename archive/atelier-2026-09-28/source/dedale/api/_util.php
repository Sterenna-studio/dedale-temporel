<?php
// api/_util.php

define('STEAM_ADMIN_CODE', 'REDACTED_ARCHIVE_ADMIN_CODE');

function json_response($data, $code=200){
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  exit;
}

function require_admin(){
  $code = $_SERVER['HTTP_X_ADMIN_CODE'] ?? ($_POST['code'] ?? ($_GET['code'] ?? ''));
  if($code !== STEAM_ADMIN_CODE){
    json_response(['ok'=>false,'error'=>'UNAUTHORIZED'], 401);
  }
}

function root_dir(){
  // /api -> root
  return realpath(__DIR__ . '/..');
}

function safe_join($base, $rel){
  $p = realpath($base . '/' . $rel);
  if($p === false) return false;
  if(strpos($p, $base) !== 0) return false;
  return $p;
}
