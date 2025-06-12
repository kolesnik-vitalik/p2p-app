import P2PNode from './services/p2pService.js'

const peer = new P2PNode()

async function start() {
  await peer.start()
  console.log('🟢 P2P-пир запущен. ID:', peer.node.peerId.toString())
}

start().catch(console.error)
