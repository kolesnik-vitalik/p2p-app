import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mdns } from '@libp2p/mdns'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { identify } from '@libp2p/identify'
import { fromString } from 'uint8arrays/from-string'

class P2PNode {
  constructor() {
    this.node = null
    this.connectedPeers = new Map()
    this.BROADCAST_TOPIC = 'network-broadcast'
  }

  async start() {
    this.node = await createLibp2p({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        transports: [tcp()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: { 
            pubsub: gossipsub(),
            identify: identify()
          },
        peerDiscovery: [
            mdns({
              interval: 10000, 
              broadcast: true,  
            })
          ]
        })

    await this.node.start()
    console.log('P2P-узел запущен. PeerID:', this.node.peerId.toString())
    this.setupEventListeners()
    return this.node
  }

  setupEventListeners() {
    this.node.addEventListener('peer:discovery', (evt) => {
      const peerId = evt.detail
      console.log(' Обнаружен пир:', peerId)
      this.node.dial(evt.detail.id).catch(console.error)
    })
    this.node.addEventListener('peer:connect', (evt) => {
        const peerId = evt.detail
        const peerIdStr = peerId.toString()
        this.connectedPeers.set(peerIdStr, {
            id: peerId,
            lastSeen: Date.now()
        })
        console.log('Подключён пир:', peerIdStr)
      })

      this.node.handle('/direct-message/1.0.0', async ({ stream }) => {
        try {
          let fullData = new Uint8Array(0);
          
          for await (const chunk of stream.source) {
            const chunkData = chunk instanceof Uint8Array ? chunk : chunk.slice();
            
            const newData = new Uint8Array(fullData.length + chunkData.length);
            newData.set(fullData);
            newData.set(chunkData, fullData.length);
            fullData = newData;
          }
      
          const message = new TextDecoder().decode(fullData);
          console.log('Получено сообщение:', message);
    
      
        } catch (err) {
          console.error('Ошибка при обработке сообщения:', err);
        } finally {
          await stream.close();
        }
      });

      const TOPIC = 'hello-message'
      this.node.services.pubsub.subscribe(TOPIC)
      this.node.services.pubsub.subscribe(this.BROADCAST_TOPIC)
      this.node.services.pubsub.addEventListener('message', (event) => {
        if (event.detail.topic === this.BROADCAST_TOPIC) {
            console.log('Broadcast сообщение:', 
                new TextDecoder().decode(event.detail.data))
        }
    })

      this.node.services.pubsub.addEventListener('message', (event) => {
          const data = event.detail.data
          console.log(new TextDecoder().decode(data))
        })
  
        setInterval(() => {
          const message = 'Hello, NET!'
          this.node.services.pubsub.publish(TOPIC, new TextEncoder().encode(message))
          .catch(()=>{})
        }, 5000)
    }

    sendAllPeerMessage(message) {
        try {
            this.node.services.pubsub.publish(
                this.BROADCAST_TOPIC,
                new TextEncoder().encode(message)
            )
            console.log(`Отправлен broadcast: ${message}`)
            return true
        } catch (err) {
            console.error('Ошибка broadcast:', err)
            return false
        }
    }

    async sendPeerByIdMessage(peerIdStr, message){
        try {
            if (!this.connectedPeers.has(peerIdStr)) {
              console.warn(`Пир ${peerIdStr} не подключен`);
              return false;
            }
        
            const peerInfo = this.connectedPeers.get(peerIdStr);
            const stream = await this.node.dialProtocol(peerInfo.id, '/direct-message/1.0.0');
        
            try {
              
              await stream.sink([fromString(message)]);
              console.log(` Сообщение отправлено пиру ${peerIdStr}`);
              return true;
            } finally {
              await stream.close();
            }
          } catch (err) {
            console.error(`Ошибка отправки пиру ${peerIdStr}:`, err);
            return false;
          }
    }
  
    getPeers() {
      return Array.from(this.connectedPeers.keys())
    }
  }
  
  export default P2PNode