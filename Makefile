init:
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt

run-prod:
	make prep-recent-runs && \
	cp ./lims_user_config_prod ./app/lims_user_config && \
	python3 settings_writer.py dev && \
	source venv/bin/activate && \
	uwsgi new-igo-qc.ini;

run-dev:
	make prep-recent-runs && \
	cp ./lims_user_config_dev ./app/lims_user_config && \
	python3 settings_writer.py dev && \
    source venv/bin/activate && \
    uwsgi new-igo-qc.ini;

prep-recent-runs:
	find ./static/html/FASTQ -type f -name "*.html" -exec touch '{}' \;

pkg-prod:
	python3 settings_writer.py prod && \
	cp ./lims_user_config_prod ./app/lims_user_config && \
    make pkg

pkg-dev:
	python3 settings_writer.py prod && \
	cp ./lims_user_config_dev ./app/lims_user_config && \
    make pkg

pkg:
	make test && \
	mkdir -p dist && \
	cat deployed_files.txt | xargs -I '{}' cp '{}' ./dist && \
	cat deployed_directories.txt | xargs -I '{}' cp -rf ./'{}' ./dist && \
	cd ./static/seq-qc && npm run build && cd - && \
	mkdir -p dist/app/view && cp -rf static/seq-qc/build/* dist/app/view

clean:
	rm -rf dist

move:
	scp -r dist igo:deployments/new-igo-qc

move-dev:
	scp -r dist dlviigoweb1:deployments/new-igo-qc

deploy:
	make clean && make pkg-prod && make move

deploy-dev:
	make clean && make pkg-dev && make move-dev

test:
	python3 test_app.py && cd static/seq-qc/ && npm run test-no-watch && cd -

