@ECHO OFF
SETLOCAL EnableDelayedExpansion

REM Detect no API key
IF [%RPC_API_KEY%]==[] (
  ECHO [WARN] RPC_API_KEY not defined. Overwrite it with your custom key to keep track of your tiles
  ECHO
)

REM Default START_MINER
if [%START_MINER%]==[] (
  set START_MINER=yes
)

REM Default SERVER_PORT
if [%SERVER_PORT%]==[] (
  set SERVER_PORT=5000
)

REM Start web interface
ECHO Starting Decentraland web dashboard!. The node will start shortly
START /B node browser\server.js --apikey %RPC_API_KEY% --serverport %SERVER_PORT%

REM Start node
ECHO Starting node
.\bin\decentraland-node ^
  --fast ^
  --loglevel=info ^
  --port=2301 ^
  --httpport=8301 ^
  --contentport=9301 ^
  --prefix="data" ^
  --n=testnet ^
  --apikey=%RPC_API_KEY% ^
  --startminer=%START_MINER%
