cd ~/open-book-webhook
git fetch origin
git reset --hard origin/main
pm2 restart "webhook"