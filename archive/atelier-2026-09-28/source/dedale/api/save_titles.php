<?php
// api/save_titles.php
header('Content-Type: application/json; charset=utf-8');

$ADMIN_CODE = 'REDACTED_ARCHIVE_ADMIN_CODE';
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$code = isset($body['admin_code']) ? (string)$body['admin_code'] : '';
if ($code !== $ADMIN_CODE) {
  http_response_code(403);
  echo json_encode(['error' => 'Forbidden']);
  exit;
}

$titles = isset($body['titles']) ? $body['titles'] : null;
if (!is_array($titles)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid titles']);
  exit;
}

$manual = isset($titles['manual']) ? $titles['manual'] : [];
if (!is_array($manual)) $manual = [];

$out = ['manual'=>[]];
foreach ($manual as $t) {
  if (!is_array($t)) continue;
  $id = isset($t['id']) ? strtoupper(preg_replace('/[^0-9A-Z_\-]/', '', (string)$t['id'])) : '';
  if ($id === '') continue;
  $name = isset($t['name']) ? (string)$t['name'] : $id;
  $hint = isset($t['hint']) ? (string)$t['hint'] : 'Débloqué manuellement.';
  $out['manual'][] = ['id'=>$id, 'name'=>$name, 'hint'=>$hint, 'type'=>'manual'];
}

$root = realpath(__DIR__ . '/..');
$jsonPath = $root . DIRECTORY_SEPARATOR . 'steam_titles.json';
file_put_contents($jsonPath, json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['ok'=>true,'count'=>count($out['manual'])]);
