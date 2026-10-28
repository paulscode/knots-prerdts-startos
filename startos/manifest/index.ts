import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  // `bitcoind`, not `knots-sha256`: Bitcoin Core, Bitcoin Knots and this
  // package are flavors of one package, so dependents (Electrs, Mempool, LND…)
  // accept any of them and a switch keeps the synced chain. The flavor itself
  // is the `#knotssha` prefix on the version in startos/versions/current.ts.
  id: 'bitcoind',
  title: 'Bitcoin Knots SHA256',
  license: 'MIT',
  donationUrl: null,
  packageRepo: 'https://github.com/paulscode/knots-sha256-startos',
  upstreamRepo: 'https://github.com/paulscode/knots-sha256',
  marketingUrl: 'https://github.com/paulscode/knots-sha256',
  description: { short, long },
  // StartOS 0.4.0.2, not the SDK's default, so the registry hides releases from
  // older servers. Every release from 2026-10-11 on targets 0.4.0.2.
  osVersion: '0.4.0.2',
  volumes: ['main', 'i2pd'],
  images: {
    bitcoind: {
      source: {
        dockerBuild: {
          buildArgs: {
            // The full release string of the Bitcoin Knots SHA256 release this
            // package installs (`tools/cfg version` → version_string in the
            // framework repo). The Dockerfile downloads
            // bitcoin-${VERSION}-<host>.tar.gz, SHA256SUMS and SHA256SUMS.asc
            // from that release's GitHub Release page and verifies the
            // signature against the pinned maintainer key. See UPDATING.md.
            VERSION: '31.1.knots-sha256.20261018',
          },
        },
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    // v0.8.1 is the first proxy release safe to run in front of a pruned node.
    // It fixes the witness check that rejected every block whose coinbase
    // commits to witnesses the block does not carry (valid blocks mined during
    // SegWit signalling; mainnet 434499 is the first, and an indexer could
    // never pass that height), and the passthrough cookie being read once at
    // startup, which answered dependents 401 from the node's next restart on.
    // v0.8.0 has both defects. Carried from knots-prerdts-startos.
    proxy: {
      source: {
        dockerTag: 'ghcr.io/start9labs/btc-rpc-proxy:v0.8.2',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    python: {
      source: {
        dockerTag: 'python:3.14.2-alpine',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    i2pd: {
      source: {
        dockerTag: 'purplei2p/i2pd:release-2.58.0',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: true,
    },
  },
})
