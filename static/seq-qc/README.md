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
|    LIMS REST   |
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
|     IGO QC     |                                           +--------+
+----------------+                                           |        |
|                |  - 1) "react-scripts build" index.html -> |        |
|                |                                           |        |
|                |                                           +--+--+--+
|                |                                              |  |
+----------------+                                              +--+
                                                              ^      |
                                                              | 3)   | 2)    
                                                              |      V
                                                       +----------------+
                                                       |    LIMS REST   |
                                                       +----------------+
                                                       |                |
                                                       |                |
                                                       |                |
                                                       |                |
                                                       +----------------+
```