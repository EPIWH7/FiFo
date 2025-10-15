# FiFo PWA → APK (GitHub Pages + Play linkage)

Этот пакет уже готов для GitHub Pages. Для связи сайта и Android-приложения (TWA) в Google Play нужен файл:
`https://<домен>/.well-known/assetlinks.json`

## Где взять правильный assetlinks.json
1) Сгенерируйте Android-пакет на https://www.pwabuilder.com для вашего URL.
2) Скачайте ZIP. Внутри будет готовый файл `assetlinks.json` (PWABuilder его создает автоматически).
3) Скопируйте содержимое из пакета PWABuilder и замените **этот** файл по пути `/.well-known/assetlinks.json`.

## Важно для GitHub Pages
- Если у вас URL вида `https://username.github.io/repo/`, то домен = `username.github.io`.
- Файл `/.well-known/assetlinks.json` должен располагаться **в корне домена**, а не в подкаталоге.
### Варианты решения:
A) Создайте репозиторий `username.github.io` и положите в него папку `.well-known/assetlinks.json`.  
B) Подключите собственный домен (CNAME) и разместите `.well-known/assetlinks.json` в корне этого домена.  
C) Если нужен только сайд-лоад APK (установка вручную, без Play) — assetlinks.json не обязателен.

## Как найти SHA-256 отпечаток
- В пакетах PWABuilder он уже вложен в `assetlinks.json`.  
- Или из командной строки (Android SDK):  
  `keytool -list -v -keystore your_keystore.jks`

После публикации `assetlinks.json` проверьте в Chrome:  
`https://<домен>/.well-known/assetlinks.json` — должен открываться JSON.

Удачи!