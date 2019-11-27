FROM nodered/node-red

USER root

RUN apk update \
    && apk add  --no-cache bash \
    && rm -rf /var/cache/apk/*

ADD --chown=root:root . /data/node_modules/@webfactorygmbh/node-red-contrib-i4scada-connector
