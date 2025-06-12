1) Выкачиваем репозиторий git clone https://github.com/kolesnik-vitalik/p2p-app
2) Переходим в папку cd p2p-app
3) Устанавливаем npm пакеты npm install
4) Переходим в папку server командой cd src/server и запускаем сервер в 1 экземпляре командой node server.js
5) Открываем другой терминал, переходим в папку p2p-app/src и запускаем 1 пир командой node index.js
6) Делаем тестовые запросы curl http://localhost:3000/peers должен вывести список всех доступных пиров
7) Копируем один из этих пиров и делаем post запрос командой:

curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Peer message",
    "peer_id": "конкретный пир подставить сюда"
  }'