# Everything CI runs. Requires node >= 18 and python >= 3.9; nothing to install.
PYTHON ?= python3

.PHONY: check build verify test test-js test-py screen stats

check: verify test screen

build:
	node tools/build.mjs

verify:
	node tools/build.mjs --check
	cd spec/v3 && sha256sum -c --quiet SHA256SUMS

test: test-js test-py

test-js:
	cd js && npm test

test-py:
	cd python && $(PYTHON) -m unittest discover -s tests

screen:
	node tools/screen.mjs

stats:
	node tools/stats.mjs
