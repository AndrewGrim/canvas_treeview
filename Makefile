debug:
	tsc
run:
	npm start
exe:
	npm run dist && cp mhwi.db dist
icon:
	base64 images/Nergigante24.png > icon.txt