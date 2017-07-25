![](https://decentraland.org/favicon.ico)

## About

Decentraland is an open-source initiative to build a shared virtual reality
world. In Decentraland, the content of each piece of land is determined by its
owner. You can become a land owner either by having someone transfer you some
of their tiles, or by mining new land. A new tile of land is mined every 10
minutes.

[Explore Decentraland](https://decentraland.org/app/)

## Components

* **Node**: An open and trustless land ownership record and scene content distribution network.
* **Editor**: An easy to use 3D scene editor, that lets you publish scenes directly to any of your tiles.
* **Browser**: A browser for navigating the virtual world of Decentraland.

# Node

A Bitcoin-like blockchain is used to maintain a universal record of land
ownership, and a consensus of the virtual world description.

In the Decentraland blockchain, transactions can transfer the ownership of a
given tile, as well as announce the hash of the scene content of the
tile. At any given time, the UTXO set has the description of the entire
virtual world. The actual content of tile is distributed in a P2P
manner, via the torrent network.

New blocks are mined with the same proof of work as Bitcoin, but instead of
having a coinbase transaction creating fungible coins, there's a landbase
transaction creating a single non-fungible asset: a tile at a unique,
non-modifiable position.

To run your own node and mine new land see [these instructions](#run-a-node).

## Design

The Decentraland node is a fork of [bcoin](https://github.com/bcoin-org/bcoin),
a Bitcoin full-node implementation in JavaScript. In what follows we describe
all the places where we depart from Bitcoin.

### Consensus rules

Instead of having the coin value, Decentraland transaction outputs have the
tile's x and y coordinates, and the info hash of the torrent with the 3D
scene content for the tile.

All transactions (except for landbase transactions) have exactly one output for
each input. Each output MUST have the same x and y coordinates as the spent
output of its corresponding input. Outputs MAY change the info hash field.

The single output of a landbase transaction MUST claim a non-allocated tile,
adjacent (with 4-connectivity) to a previously mined tile.

### RPC API

There are some new JSON RPC endpoints that facilitate creation and querying of land
content. We also list some useful RPC endpoints, inherited from Bitcoin.

* **gettile(x, y)**: fetches the torrent info hash of a tile's content.

* **settile(x, y, base64-content)**: publishes the content to the torrent
network using [WebTorrent](https://github.com/feross/webtorrent) and creates a
transaction updating the torrent info hash of one of your tiles.

* **dumpblockchain(onlyControlled=false)**: lists all tiles in the blockchain and
returns information about them. Be careful! It may take a long time to process.

* **transfertile(x, y, dest)**: Transfers tile at (x,y) to address `dest`. You must of
course own the tile to be able to transfer it. Returns the raw hex of the transfer transaction.
Note that the transaction will be automatically broadcasted to the network, no need to send it
manually.
Example:
```
./bin/cli --apikey=$RPC_API_KEY rpc transfertile 0 -1 TeaZxyQATonFFFLCXZMydUfGGUWwBsg9Je
```

* **getaccountaddress(account)**: Gets address for `account`.
To get your main decentraland address:
```
$ ./bin/cli --apikey=$RPC_API_KEY rpc getaccountaddress 0
TeaZxyQATonFFFLCXZMydUfGGUWwBsg9Je
```

For more info on how to use the command line interface, check [this bcoin wiki page](https://github.com/bcoin-org/bcoin/wiki/CLI) (decentraland-node is a fork of bcoin, so most functionality is the same).

#### Listing and drawing a map of your controlled tiles:

Use the following command in bash to list all your tiles.

    ./bin/cli --apikey=$RPC_API_KEY rpc dumpblockchain true | node scripts/list.js

Use this to render a HTML visualization of all tiles in Decentraland:

    ./bin/cli --apikey=$RPC_API_KEY rpc dumpblockchain | node scripts/plot.js

### Land content server

After each valid new block in the main chain, the node downloads from the
torrent network the updated land content for each transaction in the block,
effectively maintaining a tile to scene index.

By default, the node serves a static web server at port 9301 with the latest
scene content files for each mined tile of land. The land content file for
the tile at `(x, y)` is served at `GET /tile/x.y.lnd`

## Run a node
There's two options for installing running a node: [with docker](#run-a-node-using-docker) and [without docker](#run-a-node-manually).

### Run a node using Docker
Make sure you have [Docker
installed](https://docs.docker.com/engine/installation/), and run (**note:
you might need to prepend `sudo` to these commands on Linux systems**):

```
pip install docker-compose
docker-compose up
```

### Run a node manually
1. Clone the repo:
```
git clone https://github.com/decentraland/bronzeage-node.git && cd bronzeage-node
```
2. [Download and install NodeJS](https://nodejs.org/en/) v7.4.0. See [nvm](http://nvm.sh) for version management.
3. Install dependencies (__Linux only__):
```
apt-get update && apt-get install -y --no-install-recommends build-essential python xvfb libgtk2.0-0 libxtst-dev libxss-dev libgconf2-dev libnss3 libasound2-dev
```
4. Install npm modules: `npm install`
5. Change the `$RPC_API_KEY` env var to a custom key via `export` or by changing it in `bin/start`. You can generate a random key like this:
```
head -c 32 /dev/random | base64
```
6. Run the node!
	* Windows: `bin\start.bat`
	* Linux & Mac: `./bin/start`

You may use the CLI by running it with node:
`node bin\cli [args]`

Mining will start by default. To disable this, set `$START_MINER` to `'false'` or to `0` or edit the file `bin/start` and remove the `--startminer` argument.
7. Head over to `http://localhost:5000` (you can change the port using `$SERVER_PORT`) to see the [Web Dashboard](https://github.com/decentraland/bronzeage-node/tree/master/browser).

## How can I edit the land I own?

Once you mine some land, you can use Unity to edit its content. Check out the
[editor](https://github.com/decentraland/bronzeage-editor) for more
information.

## Community

Join us on [Slack](https://slack.decentraland.org/)!

We're on [Twitter](https://twitter.com/decentraland) too.

[logo]: https://raw.githubusercontent.com/decentraland/web/gh-pages/img/banner.png
