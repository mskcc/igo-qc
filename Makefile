init:
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt

run:
	make prep-recent-runs && \
	cp ./lims_user_config_prod ./app/lims_user_config && \
	python3 settings_writer.py dev && \
	source venv/bin/activate && \
	uwsgi new-igo-qc.ini;

prep-recent-runs:
	find ./static/html/FASTQ -type f -name "*.html" -exec touch '{}' \;

pkg:
	python3 settings_writer.py prod && \
	cp ./lims_user_config_prod ./app/lims_user_config && \
	make test && \
	mkdir -p dist && \
	cat deployed_files.txt | xargs -I '{}' cp '{}' ./dist && \
	cat deployed_directories.txt | xargs -I '{}' cp -rf ./'{}' ./dist && \
	cd ./static/seq-qc && npm run build && cd - && \
	mkdir -p dist/app/view && cp -rf static/seq-qc/build/* dist/app/view

clean:
	rm -rf dist

move:
	scp -r dist $(HOST):deployments/new-igo-qc

install:
	ssh $(HOST) 'dzdo -S rm -rf /srv/www/new-igo-qc && mv ~/deployments/new-igo-qc /srv/www && cd /srv/www/new-igo-qc && make init && dzdo -S systemctl restart uwsgi'

test_host:
	if [[ "$(HOST)" != "" ]]; then echo "Deploying to $(HOST)"; else printf "\nPlease specify HOST, e.g.\n\t'make HOST=igo.mskcc.org deploy'\n\n" && exit 1; fi

deploy:
	make HOST=$(HOST) test_host && make clean && make pkg && make HOST=$(HOST) move && make HOST=$(HOST) install

test:
	python3 test_app.py && cd static/seq-qc/ && npm run test-no-watch && cd -

