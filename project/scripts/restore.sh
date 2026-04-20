#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_file.sql>"
  exit 1
fi
cat $1 | docker exec -i data_mining_mysql /usr/bin/mysql -u root --password=rootpassword crop_yield_db
echo "Database restored from $1"
