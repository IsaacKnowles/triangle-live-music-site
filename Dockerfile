FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY config.json /usr/share/nginx/html/config.json
COPY nginx.conf /etc/nginx/conf.d/default.conf
# live_music_events.json and/or config.json are overridden at runtime via volume mounts
EXPOSE 80
