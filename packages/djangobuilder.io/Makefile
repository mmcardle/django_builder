
deploy:
ifeq "$(name)" ""
	@echo "Specify name e.g. make deploy name=staging" && exit 1
else
	firebase use $(name) || exit 1
	yarn build --mode=$(name) --outDir=dist_$(name) || exit 1
	mkdir -p dist_$(name)/db4/
	yarn --cwd apps/django-builder-4/ build-only --base=/db4/ --mode=$(name)
	cp -R apps/django-builder-4/dist/* dist_$(name)/db4/
	firebase deploy --public=dist_$(name)
endif