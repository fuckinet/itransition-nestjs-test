<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

## Installation

```bash
$ npm install
```

## Configuration
```bash
# set jwt secret env data
$ export JWT_SECRET='secret-word'

# edit mysql db config
$ nano ormconfig.json
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

# start migration
$ npm run typeorm migration:run
```

## Routes:
**POST: /auth/login**

Request:
```
{
  "login": String,
  "password": String
}
```
Response:
```
{
  "token": String
}
```

\
**POST: /auth/register**

Request:
```
{
  "email": String,
  "password": String,
  "firstname": String,
  "lastname": String,
  "birthday": String
}
```
Response:
```
204 No Content
```

\
**PATCH <AUTH_REQUIRE> /users/:id**

Request: (Can be use one of object properties or many)
```
{
  "firstname": String,
  "lastname": String,
  "birthday": String
}
```
Response:
```
{
  "id": Number,
  ...(edited properties)
}
```

\
** <AUTH_REQUIRE> - Require `Authorization: Bearer <JWT_TOKEN>` header.
