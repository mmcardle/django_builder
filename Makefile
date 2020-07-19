
deploy:
ifeq "$(name)" ""
	@echo "Specify name e.g. make deploy name=staging" && exit 1
else
	firebase use $(name) || exit 1
	yarn build --mode=$(name) --dest=dist_$(name) || exit 1
	firebase deploy --public=dist_$(name)
endif