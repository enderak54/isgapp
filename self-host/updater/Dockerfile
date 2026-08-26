# isgapp-updater — uygulama içinden (Ayarlar > Sürüm Takip) güncelleme tetikleyen servis.
#
# isgapp konteynerinden /update isteği alır, self-host/update.sh'i çalıştırır.
# Docker socket'ine erişmesi için root çalışır; aynı ağdaki isgapp dışında
# hiçbir portu yayınlamaz ve UPDATER_API_KEY ile yetkilendirilir.
FROM node:20-alpine

RUN apk add --no-cache \
    docker-cli \
    docker-cli-compose \
    git \
    openssh-client \
    curl

WORKDIR /srv

RUN mkdir -p /data

COPY server.mjs ./

ENV UPDATER_PORT=9100
ENV LOG_FILE=/data/update.log
ENV LOCK_FILE=/data/update.lock
ENV UPDATE_SCRIPT=/repo/self-host/update.sh
ENV WORKDIR=/repo/self-host

EXPOSE 9100

CMD ["node", "server.mjs"]
