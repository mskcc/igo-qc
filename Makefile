init:
	python3 -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt

run:
	source venv/bin/activate && \
	uwsgi igo-qc.ini;

pkg:
	mkdir -p dist && \
	cat deployed_files.txt | xargs -I '{}' cp '{}' ./dist && \
	cp -rf ./templates ./dist && \
	mkdir -p dist/static/seq-qc/dist && cp static/seq-qc/dist/bundle.js dist/static/seq-qc/dist


