SHELL:= /bin/bash

CONTRACT_NAME=test.wax
CLASS_NAME=testwax

WAX_API=http://localhost:8888

clean: clean-build

clean-build:
	-rm *.abi *.wasm

build:
	eosio-cpp ./src/${CLASS_NAME}.cpp -o ./${CLASS_NAME}.wasm -I ./include/ -abigen_output ./${CLASS_NAME}.abi

.PHONY:deploy-wax-mainnet
deploy:
	cleos -u ${WAX_API} set contract "${CONTRACT_NAME}" ./ "${CLASS_NAME}.wasm" "${CLASS_NAME}.abi" -p ${CONTRACT_NAME}@deploy

production/deploy: export WAX_API=https://wax.greymass.com
production/deploy: deploy