# React Integration

## Current State
The igo-qc application uses a flask framework to render html, which will then be run client-side.
This dependency on the back-end python to render the front-end javascript/html/css limits the use of recent advances in front-end build tools (everything runs through flask's render_template function) and increases coupling. 
```
+----------------+
|     IGO QC     |                              +--------+
+----------------+                              |        |
|                | - 3) flask rendered html ->  |        |
|                |                              |        |
|                |                              +--+--+--+
|                |                                 |  |
+----------------+                                 +--+
    ^      |
    | 2)   | 1)    
    |      V
+----------------+
|    NGS STATS   |
+----------------+
|                |
|                |
|                |
|                |
+----------------+
```

## New State
```
+----------------+
|     IGO QC     |                                                      +--------+
+----------------+  <- 1b) Request additional resources from server     |        |
|                |  -  1a) template's index.html w/ webpack main..js -> |        |
|                |                                                      |        |
|                |                                                      +--+--+--+
|                |                                                         |  |         
+----------------+                                                         +--+
                                                                         ^      |
                                                                         | 3)   | 2)    
                                                                         |      V
                                                                    +----------------+
                                                                    |    NGS STATS   |
                                                                    +----------------+
                                                                    |                |
                                                                    |                |
                                                                    |                |
                                                                    |                |
                                                                    +----------------+
```

## Build
```
$ npm run wbpk
```

**What's going on?**
A new `static/seq-qc/dist/main.js` is being created.

React is used to inject the new javascript code into the existing index.html. 
Webpack bundles our code into the `main.js` that will be injected.

See `templates/index.html`,
```
<!-- Entry point for react -->
<div class="row" id="react_app"></div>
...
<script src="{{ url_for('static', filename='seq-qc/dist/main.js') }}" type="module"></script>
```
