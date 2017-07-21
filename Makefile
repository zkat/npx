text-files = README.md CHANGELOG.md LICENSE.md

bin: bin/npx.1 bin/package.json bin/node_modules $(text-files)

bin/%: $(text-files)
	cp $(text-files) bin/

bin/npx.1: libnpx.1
	cat $< | sed s/libnpx/npx/ > $@

libnpx.1: README.md
	npm run docs

bin/package.json: package.json bin/package.template.json
	cat bin/package.template.json | npx json -e "this.version = '$$(cat package.json | npx json version)'" > $@
	npx json -I -f $@ -e "this.dependencies.libnpx = '$$(cat $@ | npx json version)'"

bin/node_modules: bin/package.json
	cd bin && npm i

clean:
	rm -rf bin/npx.1 bin/package.json bin/node_modules libnpx.1 $(addprefix bin/, $(text-files))

.PHONY: clean
