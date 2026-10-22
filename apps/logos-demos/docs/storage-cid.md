# The Logos Storage CID, computed in a browser

How the storage demo gives a file the exact address Logos Storage would, without
joining the network. Code: [`src/lib/storage-cid.ts`](../src/lib/storage-cid.ts),
[`src/lib/storage-mimetypes.ts`](../src/lib/storage-mimetypes.ts) and
[`src/lib/storage-proof.ts`](../src/lib/storage-proof.ts).

A browser can't join Logos Storage, but it doesn't need to for this. A node
doesn't hand out CIDs; a CID is a pure function of the bytes, so the browser can
compute it. This is the only hands-on part of the storage demo.

## How it was worked out

We read the scheme out of `logos-storage/logos-storage-nim` at `master`, then
checked it against a running node. The project publishes prebuilt binaries, so
you don't need to build anything:

```
gh release download v0.4.5 --repo logos-storage/logos-storage-nim \
  --pattern "logos-storage-darwin-arm64-v0.4.5.zip"
```

Start it with an API port and no bootstrap, upload a file, and it prints the
CID:

```
./logos-storage-darwin-arm64-v0.4.5 --data-dir=./nodedata --api-port=18100 \
  --api-bindaddr=127.0.0.1 --listen-port=18101 --disc-port=18102 \
  --nat=extip:127.0.0.1 --no-bootstrap-node

curl -X POST http://127.0.0.1:18100/api/storage/v1/data \
  -H "Content-Type: text/plain" \
  -H 'Content-Disposition: attachment; filename="hello.txt"' \
  --data-binary @hello.txt
```

The node's answers are the fixtures in `src/lib/storage-cid.test.ts`, so the
tests fail if the implementation drifts from the network. A test that only
checked the code against itself could never catch that.

The node also writes each manifest to `<data-dir>/repo/manifests/` as raw
protobuf. When our encoding didn't match, running `xxd` on that file showed
exactly which field was wrong, which beat any amount of guessing.

## The scheme

Blocks are 64 KiB (`DefaultBlockSize`). The last block is zero-padded to the
full size before hashing, so an 11-byte file still hashes 64 KiB. This is the
easiest part to get wrong: skip the padding and you get a plausible CID and no
error.

Each leaf is `sha256(paddedBlock)`.

The tree combines nodes with `compress(x, y, key) = sha256(x ‖ y ‖ keyByte)`,
where the key byte says what is being combined:

| Key | Meaning                                |
| --- | -------------------------------------- |
| 0   | an ordinary pair                       |
| 1   | a pair on the bottom layer             |
| 2   | an odd node, paired with 32 zero bytes |
| 3   | both at once                           |

A layer with an odd count pairs its last node with zeroes. A single leaf is
still compressed, so even a one-block file has a level above its leaf.

All the CIDs are CIDv1 with sha2-256 and differ only in the content codec:

| Codec              | Value    | What it names                         |
| ------------------ | -------- | ------------------------------------- |
| `storage-manifest` | `0xCD01` | the manifest, the CID the node prints |
| `storage-block`    | `0xCD02` | one block                             |
| `storage-root`     | `0xCD03` | the merkle root                       |

The manifest is a protobuf wrapped in a one-field envelope. Its fields, in
order, are `manifestVersion`, `treeCid`, `blockSize`, `datasetSize`, `codec`,
`hcodec`, `version`, `filename` and `mimetype`.

## Nodes refuse most MIME types

The node doesn't store whatever Content-Type you send. It looks the value up in
nim's `std/mimetypes` and answers 422 when nothing maps to it:

```nim
let extension = m.getExt(mimetypeVal, "")
if extension == "":
  return RestApiResponse.error(Http422, "The MIME type ... is not valid.")
```

`text/markdown` isn't in that table, and browsers report it for every `.md`
file, so dropping a README on the demo hits this. An upload with no Content-Type
is fine: the field is just left out of the manifest.

So when the browser's type would be refused, the page leaves the mimetype out
and says so. `src/lib/storage-mimetypes.ts` holds the accepted set, generated
from nim's table. Don't widen it by guessing; check against a node.

## Merkle proofs

`src/lib/storage-proof.ts` ports `getProof` and `reconstructRoot` from
`logos-storage/nim-merkletree`, which is what the node runs. A storage proof
checks that one block plus a path of siblings folds back to the root.

The fold has to reproduce the key byte exactly, odd-node case included, or an
honest proof reconstructs the wrong root. The tests check every block index of
files with one, three, five and seven blocks, because odd counts are where the
padding and the key byte change. They also check the fold against a root a real
node published, not one this code produced.

## Two traps

`version` is 2, not 1. The field holds nim-libp2p's `CidVersion` enum, which
starts at `CIDvIncorrect`, so `CIDv1` encodes as 2. Writing 1 gives a wrong CID
and no error anywhere.

Filename and mimetype change the CID. They are manifest fields, so the same
bytes uploaded under a different name get a different address. The node reads
the name from `Content-Disposition`; a `?filename=` query parameter does
nothing. That cost us an hour of suspecting the encoder when the test's
expectation was what was wrong.

## What this does not do

It doesn't store anything, and nothing else in this app does either.
[research/storage-research.md](./research/storage-research.md) records what we
checked.

For a while the demo published files to an object store of our own so a link
could be shared. We removed it: a demo of somebody else's storage doesn't belong
under a Logos Storage heading, however well it is labelled.
