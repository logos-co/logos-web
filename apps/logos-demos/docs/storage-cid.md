# The Logos Storage CID, computed in a browser

A browser cannot join Logos Storage. It can still give a file the exact address
the network would, because a CID is not something a node hands out. It is a
pure function of the bytes.

This is what `src/lib/storage-cid.ts` does, and it is the only part of the
storage demo that is genuinely hands-on.

## How it was worked out

Read out of `logos-storage/logos-storage-nim` at `master`, then **checked
against a running node**. The project publishes prebuilt binaries, so this
needs no build:

```
gh release download v0.4.5 --repo logos-storage/logos-storage-nim \
  --pattern "logos-storage-darwin-arm64-v0.4.5.zip"
```

Run it with an API port and no bootstrap, upload a file, and it prints the CID:

```
./logos-storage-darwin-arm64-v0.4.5 --data-dir=./nodedata --api-port=18100 \
  --api-bindaddr=127.0.0.1 --listen-port=18101 --disc-port=18102 \
  --nat=extip:127.0.0.1 --no-bootstrap-node

curl -X POST http://127.0.0.1:18100/api/storage/v1/data \
  -H "Content-Type: text/plain" \
  -H 'Content-Disposition: attachment; filename="hello.txt"' \
  --data-binary @hello.txt
```

Those answers are the fixtures in `storage-cid.test.ts`. The tests fail if the
implementation drifts from the network, which a self-consistent test could
never catch.

The node also writes each manifest to `<data-dir>/repo/manifests/`, as the raw
protobuf. That is worth more than any amount of guessing. When the encoding
did not match, `xxd` on that file showed exactly which field was wrong.

## The scheme

**Blocks.** 64 KiB (`DefaultBlockSize`). The last block is **zero-padded to the
full size** before hashing, so an 11-byte file still hashes 64 KiB. This is the
easiest thing to get wrong: skipping the padding produces a plausible CID and
nothing complains.

**Leaves.** `sha256(paddedBlock)`.

**Tree.** `compress(x, y, key) = sha256(x ‖ y ‖ keyByte)`. The key byte marks
what is being combined:

| Key | Meaning                                |
| --- | -------------------------------------- |
| 0   | an ordinary pair                       |
| 1   | a pair on the bottom layer             |
| 2   | an odd node, paired with 32 zero bytes |
| 3   | both at once                           |

A layer with an odd count pairs its last node with zeroes. A single leaf is
still compressed, so even a one-block file has a level above its leaf.

**CIDs.** All CIDv1 with sha2-256, differing only in the content codec:

| Codec              | Value    | What it names                         |
| ------------------ | -------- | ------------------------------------- |
| `storage-manifest` | `0xCD01` | the manifest, the CID the node prints |
| `storage-block`    | `0xCD02` | one block                             |
| `storage-root`     | `0xCD03` | the merkle root                       |

**Manifest.** A protobuf, wrapped in a one-field envelope. Fields in order:
`manifestVersion`, `treeCid`, `blockSize`, `datasetSize`, `codec`, `hcodec`,
`version`, `filename`, `mimetype`.

## Nodes refuse most MIME types

The node does not store whatever Content-Type you send. It looks the value up
in nim's `std/mimetypes` and answers 422 when nothing maps to it:

```nim
let extension = m.getExt(mimetypeVal, "")
if extension == "":
  return RestApiResponse.error(Http422, "The MIME type ... is not valid.")
```

`text/markdown` is not in that table, and browsers report it for every `.md`
file, so dropping a README on the demo hits this. An upload with **no**
Content-Type is fine, though: the field is simply left out of the manifest.

That is what the page does when the browser's type would be refused, and it
says so. `src/lib/storage-mimetypes.ts` carries the accepted set, generated
from nim's table. Do not widen it by guessing; check against a node.

## Merkle proofs

`src/lib/storage-proof.ts` ports `getProof` and `reconstructRoot` from
`logos-storage/nim-merkletree`, which is what the node runs. It is what a
storage proof checks: one block plus a path of siblings folds back to the root.

The fold has to reproduce the key byte exactly, including the odd-node case, or
an honest proof reconstructs the wrong root. The tests check every block index
of files with one, three, five and seven blocks, because odd counts are where
the padding and the key byte change, and they check the fold against a root a
real node published rather than one this code produced.

## Two traps

**`version` is 2, not 1.** The field holds nim-libp2p's `CidVersion` enum,
which starts at `CIDvIncorrect`, so `CIDv1` encodes as 2. Writing 1 gives a
wrong CID with no error anywhere.

**Filename and mimetype change the CID.** They are manifest fields, so the same
bytes uploaded with a different name have a different address. The node reads
the name from `Content-Disposition`, not from a query parameter. Passing
`?filename=` silently does nothing, which cost an hour of thinking the encoder
was wrong when the test's expectation was.

## What this does not do

It does not store anything, and neither does anything else in this app. See
[storage-research.md](./storage-research.md) for what was checked.

The demo briefly published files to an object store of our own so a link could
be shared. That was removed: a demo of somebody else's storage does not belong
under a Logos Storage heading, however well labelled.
