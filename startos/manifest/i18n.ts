// short and long are authored in en_US and carried into the other locales
// unchanged. Describing which chain a node follows and what its consensus
// rules are is not something to hand to a translation engine; a wrong word
// here misleads someone choosing between flavors. torDescription below is
// upstream's and is genuinely translated, so it is left alone.
const shortEn =
  "Bitcoin Knots for the SHA256 chain: a Bitcoin full node with Knots' policy controls, consensus-identical to Bitcoin Core"

const longEn =
  "Bitcoin Knots SHA256 is Bitcoin Knots' patch series maintained on top of Bitcoin Core for the SHA256 chain, the chain Bitcoin Core follows. Consensus is never modified: this node accepts exactly the blocks Bitcoin Core accepts. What it adds is what Knots always added, the larger set of relay and mining policy controls (OP_RETURN limits, parasite and token filters, replacement rules, bare multisig and dust settings) with Knots' defaults. It does not carry BIP-110 (RDTS) or the BLAKE2b proof-of-work change that Bitcoin Knots adopted after 29.3; if you want those, install Bitcoin Knots (RDTS), which follows a different chain. This is a flavor of the bitcoind package: switch to it from Bitcoin Core or Bitcoin Knots (pre-RDTS) and keep your synced chain, and services that accept Bitcoin Core accept it. Releases are built from the public source repository and signed by the maintainer; the package verifies that signature before it installs a binary. Like the other bitcoind flavors it runs an embedded I2P router beside the node and an RPC proxy in front of it that, when the node is pruned, fetches missing blocks from peers."

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
