##  Отправка ваших USDT на резервный адрес

Node скрипт создает маленькое API на порту 3020

Арендуем VPS или выделенный сервер(надежней).

Клонируем туда репозиторий. Переходим в папку проекта.

### Далее выполняем команды

Клонируем себе фаил кошельков:
```bash
cp wallets-sample.json wallets.json
```
Открываем wallets.json и редактируем его как там указано.

### Управление Docker контейнером:

1. **Сборка и запуск контейнера**:
```bash
docker build -t usdt-sender . && docker run --name usdtSender -p 3020:3020 usdt-sender
```
2. **Пересборка и перезапуск (если внесли изменения в код или фаил кошельков)**:
```bash
docker build -t usdt-sender . && docker stop usdtSender 2>/dev/null; docker rm usdtSender 2>/dev/null; docker run --name usdtSender -p 3020:3020 usdt-sender
```
3. **Просмотр логов**:
```bash
docker logs usdtSender --follow  # Логи в реальном времени
```

У вас получиться адрес типа: http://192.177.4.5:3020/ 
По команде от бота на этот адрес, скрипт выполнит отправку.