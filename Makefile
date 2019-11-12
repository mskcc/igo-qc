init:
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt

run-prod:
	python3 settings_writer.py prod && \
	source venv/bin/activate && \
	uwsgi new-igo-qc.ini;

run-dev:
	python3 settings_writer.py dev && \
    source venv/bin/activate && \
    uwsgi new-igo-qc.ini;

pkg:
	python3 settings_writer.py prod && \
	mkdir -p dist && \
	cat deployed_files.txt | xargs -I '{}' cp '{}' ./dist && \
	cp -rf ./templates ./dist && \
	cd ./static/seq-qc && npm run wbpk:prod && cd - && \
	mkdir -p dist/static/seq-qc/dist && cp static/seq-qc/dist/bundle.js dist/static/seq-qc/dist

clean:
	rm -rf dist

move:
	scp -r dist igo:deployments/new-igo-qc

deploy:
	make clean && make pkg && make move
