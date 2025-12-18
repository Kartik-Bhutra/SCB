FROM mysql:latest

COPY schema.sql /docker-entrypoint-initdb.d/db.sql

ENV MYSQL_ROOT_PASSWORD=password
ENV MYSQL_DATABASE=scb

EXPOSE 3306

CMD ["mysqld", "--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci"]