#!/bin/bash
# Backup MySQL Data Mining DB
mkdir -p ../backup
docker exec data_mining_mysql /usr/bin/mysqldump -u root --password=rootpassword crop_yield_db > ../backup/backup_$(date +%F).sql
echo "Backup saved in project/backup/"
