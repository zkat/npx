text-files = README.md CHANGELOG.md LICENSE.md

bin: bin/npx.1 bin/package.json bin/node_modules $(text-files)

bin/%: $(text-files)
	cp $(text-files) bin/

bin/npx.1: libnpx.1
	cat $< | sed s/libnpx/npx/ > $@

libnpx.1: README.md
	npm run docs

bin/package.json: package.json bin/package.template.json
	cat bin/package.template.json | json -e "this.version = '$$(cat package.json | json version)'" > $@
	json -I -f $@ -e "this.dependencies.libnpx = '$$(cat $@ | json version)'"

bin/node_modules: bin/package.json
	cd bin && npm i

clean:
	rm -rf bin/README.md bin/npx.1 bin/package.json bin/node_modules bin/package-lock.json libnpx.1

.PHONY: clean
