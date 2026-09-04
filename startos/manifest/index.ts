import { setupManifest } from '@start9labs/start-sdk'
import { long, short, torDescription } from './i18n'

export const manifest = setupManifest({
  // The id stays `knots-prerdts`. It is identity, not a label: the registry
  // indexes by (id, version, sighash) and there is no rename path, so changing
  // it would strand every install rather than rename anything. The version
  // flavor `#knotsprerdts` is fixed for the same reason.
  //
  // The title says SHA256 because that is what a user needs to know at the
  // moment they are choosing between this and the BLAKE2b companion: which
  // chain it follows. "pre-RDTS" describes how this build differs from the
  // other Knots flavors, which is a second-order question and one the
  // description can answer.
  id: 'knots-prerdts',
  title: 'Bitcoin Knots (SHA256) Companion',
  license: 'MIT',
  donationUrl: null,
  packageRepo: 'https://github.com/paulscode/knots-prerdts-startos',
  upstreamRepo: 'https://github.com/bitcoinknots/bitcoin',
  marketingUrl: 'https://bitcoinknots.org/',
  description: { short, long },
  volumes: ['main', 'i2pd'],
  images: {
    bitcoind: {
      source: {
        dockerBuild: {
          buildArgs: {
            VERSION: '29.3.knots20260507',
            PATH_VERSION: '29.x',
          },
        },
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    proxy: {
      source: {
        dockerTag: 'ghcr.io/start9labs/btc-rpc-proxy:v0.8.0',
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
      emulateMissingAs: 'x86_64',
    },
  },
  dependencies: {
    tor: {
      description: torDescription,
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
