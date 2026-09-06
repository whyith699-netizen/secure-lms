#!/usr/bin/env bash
set -euo pipefail

# SECURE LMS - Automated Backup & Export Script
# Usage: ./scripts/backup.sh [PROJECT_ID] [BACKUP_BUCKET_NAME]

PROJECT_ID="${1:-codeclub-lms-56ad7c}"
DATE="$(date +%Y%m%d_%H%M%S)"
BACKUP_BUCKET="${2:-gs://${PROJECT_ID}-backups}"
EXPORT_DIR="./backups/${DATE}"

echo "=== Memulai Backup SECURE LMS [Project: ${PROJECT_ID}] ==="
mkdir -p "${EXPORT_DIR}"

# 1. Export Firebase Authentication Users
echo "[1/3] Mengekspor akun Firebase Authentication..."
npx firebase auth:export "${EXPORT_DIR}/users_export.json" --project "${PROJECT_ID}" --format=json || {
  echo "Peringatan: Gagal mengekspor Auth users. Pastikan Anda telah login atau memiliki izin auth.admin."
}

# 2. Managed Firestore Export via Google Cloud CLI / REST API
echo "[2/3] Memicu Managed Firestore Export..."
if command -v gcloud &> /dev/null; then
  echo "Menjalankan Firestore export ke ${BACKUP_BUCKET}/firestore/${DATE}..."
  gcloud firestore export "${BACKUP_BUCKET}/firestore/${DATE}" --project="${PROJECT_ID}" || {
    echo "Peringatan: gcloud firestore export gagal. Pastikan bucket ${BACKUP_BUCKET} sudah dibuat dan Cloud Firestore Service Agent memiliki izin storage.admin."
  }
else
  echo "Info: CLI 'gcloud' belum terpasang di sistem lokal ini. Untuk backup Firestore terjadwal di cloud, gunakan Cloud Scheduler + Cloud Functions atau pasang Google Cloud SDK."
fi

# 3. Cloud Storage Sync / Backup
echo "[3/3] Menyiapkan ringkasan file backup lokal..."
echo "Lokasi ekspor lokal: ${EXPORT_DIR}"
ls -la "${EXPORT_DIR}" || true

echo "=== Backup selesai pada $(date) ==="
