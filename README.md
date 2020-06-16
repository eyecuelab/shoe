# Shoe Shine

### Local Setup
```
cd api
npm ci
npm start
```

## DevOps

Push to Heroku
```
git push heroku master
```

Reset DB on Heroku
```
heroku pg:reset -a shoeshine
```

Migrate DB on Heroku
```
heroku run "npm run db:migrate --prefix api" -a shoeshine
```

Seed DB
```
heroku run "npm run db:seed --prefix api" -a shoeshine
```
