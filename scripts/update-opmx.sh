cd ../opmx-frontend
git fetch origin
git reset --hard origin/main
yarn
yarn build
pm2 restart "opmx"