// short and long are authored in en_US and carried into the other locales
// unchanged. They used to hold a real translation of a generic paragraph about
// Bitcoin that said nothing about this package, and describing which side of a
// possible consensus split a node sits on is not a thing to hand to a
// translation engine. torDescription below is upstream's and is genuinely
// translated, so it is left alone.
const shortEn =
  'A Bitcoin Knots node on the SHA256 chain that does not enforce BIP-110'

const longEn =
  'Bitcoin Knots, following the SHA256 chain: the same chain Bitcoin Core follows, and the same one the official Bitcoin and Bitcoin Knots services follow. What distinguishes this build is what it does not do. Knots ships the BIP-110 softfork, known as RDTS, and this flavor never enforces it, so if the network ever splits over BIP-110 this node stays on the side that does not require it. It installs alongside the official Bitcoin service rather than replacing it, under its own id and its own ports, so you can run one node that enforces BIP-110 and one that does not at the same time. That is the reason to install it; if you only want one Knots node, the official package is the one to use. It can be pruned, and when it is, the package runs an RPC proxy in front of it that fetches dropped blocks from peers, so a connected service still gets any block it asks for. An I2P router runs beside it. Pair it with Datum Gateway (SHA256) Companion to mine this chain.'

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
