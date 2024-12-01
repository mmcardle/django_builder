
deploy:
ifeq "$(name)" ""
	@echo "Specify name e.g. make deploy name=staging" && exit 1
else
	firebase use $(name)
	yarn run build_$(name)
	rm -rf dist_$(name)
	mkdir -p dist_$(name)
	cp -r packages/djangobuilder.io/dist/* dist_$(name)/
	mkdir -p dist_$(name)/db4/
	cp -r packages/djangobuilder4/dist/* dist_$(name)/db4/
	firebase deploy --public=dist_$(name)
endif