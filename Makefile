init:
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt

run-prod:
	cp ./lims_user_config_prod ./app/lims_user_config && \
	python3 settings_writer.py prod && \
	source venv/bin/activate && \
	uwsgi new-igo-qc.ini;

run-dev:
	cp ./lims_user_config_dev ./app/lims_user_config && \
	python3 settings_writer.py dev && \
    source venv/bin/activate && \
    uwsgi new-igo-qc.ini;

pkg:
	make test && \
	python3 settings_writer.py prod && \
	cp ./lims_user_config_prod ./app/lims_user_config && \
	mkdir -p dist && \
	cat deployed_files.txt | xargs -I '{}' cp '{}' ./dist && \
	cat deployed_directories.txt | xargs -I '{}' cp -rf ./'{}' ./dist && \
	cd ./static/seq-qc && npm run wbpk:prod && cd - && \
	mkdir -p dist/static/seq-qc/dist && cp -rf static/seq-qc/dist dist/static/seq-qc

pkg-dev:
	make test && \
	python3 settings_writer.py prod && \
	cp ./lims_user_config_dev ./app/lims_user_config && \
	mkdir -p dist && \
	cat deployed_files.txt | xargs -I '{}' cp '{}' ./dist && \
	cat deployed_directories.txt | xargs -I '{}' cp -rf ./'{}' ./dist && \
	cd ./static/seq-qc && npm run wbpk:prod && cd - && \
	mkdir -p dist/static/seq-qc/dist && cp -rf static/seq-qc/dist dist/static/seq-qc

clean:
	rm -rf dist

move:
	scp -r dist igo:deployments/new-igo-qc

move-dev:
	scp -r dist dlviigoweb1:deployments/new-igo-qc

deploy:
	make clean && make pkg && make move

deploy-dev:
	make clean && make pkg-dev && make move-dev

test:
	python3 test_app.py

