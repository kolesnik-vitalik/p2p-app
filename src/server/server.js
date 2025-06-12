import express from 'express';
import P2PNode from '../services/p2pService.js';

const p2pNode = new P2PNode()

 const start = async () =>{

    const app = express()
    app.use(express.json());
    const port = 3000
    await p2pNode.start()
    
    app.get('/peers', (req, res) => {
        const peersList = p2pNode.getPeers()
        res.json({
            peersList: peersList});
    })

    app.post('/message', async (req, res) =>{
        const {message, peer_id} = req.body;
        if(!message){
            return res.status(400).json({
                error: "message обязательное поле для ввода"
            })
        }
        if(peer_id && !p2pNode.getPeers().includes(peer_id)) {
            console.log('Текущие пиры:', p2pNode.getPeers())
            return res.status(404).json({
                error: `Peer ${peer_id} не подключен. Доступные пиры: ${p2pNode.getPeers().join(', ')}`
            })
        }

        try {
            if (peer_id) {
              const success = await p2pNode.sendPeerByIdMessage(peer_id, message)
              if (!success) {
                return res.status(404).json({
                  error: "Не удалось отправить сообщение указанному пиру"
                })
              }
              return res.json({
                status: "success",
                message: "Сообщение отправлено указанному пиру",
                peer_id:peer_id,
                content: message
              })
            } else {
              const success = p2pNode.sendAllPeerMessage(message)
            if (!success) {
                return res.status(500).json({ error: "Не удалось отправить broadcast" })
            }
            return res.json({
                status: "success",
                message: "Сообщение отправлено всем пирам",
                recipients_count: p2pNode.getPeers().length,
                content: message
            })
            }
          } catch (err){
            console.error("Ошибка:", err)
            return res.status(500).json({
                 error: "Внутренняя ошибка сервера"
                })
          }
        

    })
    
    app.listen(port, () =>{
        console.log(`Сервер запущен на порту ${port}`)
    })
}

start().catch(console.error)