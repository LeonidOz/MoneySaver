## Node скрипт для выполнения отправки USDT по команде от бота.
При запуске скрипт создает маленькое api на порту 3020

Арендуем VPS (надежней выделенный сервер).

Клонируем туда репозиторий. Переходим в папку проекта.

### Далее выполняем команды

Создаем свой фаил кошельков:
```bash
cp wallets-sample.json wallets.json
```
Открываем его и редактируем как там указано.

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

У вас получиться адрес типа http://192.177.4.5:3020/