debug:
	tsc --outDir ../mhwi_db src/*
run:
	npm start
exe:
	npm run dist && cp mhwi.db dist