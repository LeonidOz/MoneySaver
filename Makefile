start:
	docker build -t usdt-sender . && docker run --name usdtSender -p 3020:3020 usdt-sender
build:
	docker build -t usdt-sender . && docker stop usdtSender 2>/dev/null; docker rm usdtSender 2>/dev/null; docker run --name usdtSender -p 3020:3020 usdt-sender
log:
	docker logs usdtSender --follow
stop:
	docker stop usdtSender 2>/dev/null || true