import App from './App.js';
const e = React.createElement;

// "DYNAMIC" loading of css - put all .css into "index.css"
// REF - https://stackoverflow.com/a/41133213/3874247
function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
}
// REF - https://github.com/Microsoft/monaco-editor/issues/886#issuecomment-392516431
function injectCss(content) {
    const css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = content;
    document.head.appendChild(css);
}
injectCss(loadFile('./static/seq-qc/jsx-src/index.css'));

const domContainer = document.querySelector('#react_app');
ReactDOM.render(e(App), domContainer);