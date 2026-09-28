<?php
// api/scan_projects.php
// Lists subdirectories of /base/steam and updates ../steam_projects.json
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

$root = realpath(__DIR__ . '/..');
if ($root === false) {
  http_response_code(500);
  echo json_encode(['error' => 'Root not found']);
  exit;
}

$exclude = ['.', '..', 'api', 'assets'];
$dirs = [];

$items = scandir($root);
foreach ($items as $it) {
  if (in_array($it, $exclude, true)) continue;
  if ($it[0] === '.') continue;
  $path = $root . DIRECTORY_SEPARATOR . $it;
  if (is_dir($path)) {
    $dirs[] = $it;
  }
}

// Load existing json to preserve metadata
$jsonPath = $root . DIRECTORY_SEPARATOR . 'steam_projects.json';
$existing = [];
if (file_exists($jsonPath)) {
  $rawJson = file_get_contents($jsonPath);
  $parsed = json_decode($rawJson, true);
  if (is_array($parsed)) {
    foreach ($parsed as $p) {
      if (isset($p['slug'])) $existing[$p['slug']] = $p;
    }
  }
}

$result = [];
$seen = [];
foreach ($dirs as $slug) {
  $seen[$slug] = true;
  $p = isset($existing[$slug]) ? $existing[$slug] : [
    'slug' => $slug,
    'title' => ucfirst($slug),
    'description' => '',
    'tags' => [],
    'icon' => '⚙️',
    'status' => 'DEV',
    'order' => 9999
  ];

  // Normalize minimal fields
  $p['slug'] = $slug;
  if (!isset($p['tags'])) $p['tags'] = [];
  if (is_string($p['tags'])) {
    $p['tags'] = array_values(array_filter(array_map('trim', explode(',', $p['tags']))));
  }
  if (!isset($p['status'])) $p['status'] = 'DEV';
  if (!isset($p['order'])) $p['order'] = 9999;
  if (!isset($p['icon'])) $p['icon'] = '⚙️';
  if (!isset($p['title'])) $p['title'] = ucfirst($slug);
  if (!isset($p['description'])) $p['description'] = '';

  $result[] = $p;
}

file_put_contents($jsonPath, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['ok' => true, 'count' => count($result)]);
