// short and long are authored in en_US and carried into the other locales
// unchanged. They used to hold a real translation of a generic paragraph about
// Bitcoin that said nothing about this package, and describing which side of a
// possible consensus split a node sits on is not a thing to hand to a
// translation engine. torDescription below is upstream's and is genuinely
// translated, so it is left alone.
const shortEn =
  'A pruned Bitcoin Knots node for the SHA256 chain, to run beside your main node'

const longEn =
  'Bitcoin Knots for the SHA256 chain, the chain Bitcoin Core follows, as a second node beside your existing Bitcoin or Bitcoin Knots service. It has its own id, its own ports and its own data, and it is pruned by default so both nodes fit on one machine. Run it when you want a node with Knots\' policy defaults without replacing the node your other services depend on, or pair it with Datum Gateway (SHA256) Companion to mine this chain. Pruned nodes still serve dependents: an RPC proxy in front of the node fetches any pruned block from peers on demand. An I2P router runs beside it. It follows Bitcoin Knots SHA256 releases (Bitcoin Knots\' patch series maintained on top of Bitcoin Core for the SHA256 chain) in lock-step with the drop-in Bitcoin Knots SHA256 package.'

export const short = {
  en_US: shortEn,
  es_ES: shortEn,
  de_DE: shortEn,
  pl_PL: shortEn,
  fr_FR: shortEn,
}

export const long = {
  en_US: longEn,
  es_ES: longEn,
  de_DE: longEn,
  pl_PL: longEn,
  fr_FR: longEn,
}

export const torDescription = {
  en_US:
    'Required for .onion peer connectivity, onlynet=onion, or when a Tor address is requested.',
  es_ES:
    'Requerido para conectividad de pares .onion, onlynet=onion, o cuando se solicita una dirección Tor.',
  de_DE:
    'Erforderlich für .onion Peer-Konnektivität, onlynet=onion oder wenn eine Tor-Adresse angefordert wird.',
  pl_PL:
    'Wymagany dla połączeń .onion z peerami, onlynet=onion lub gdy żądany jest adres Tor.',
  fr_FR:
    "Requis pour la connectivité .onion entre pairs, onlynet=onion, ou lorsqu'une adresse Tor est demandée.",
}
